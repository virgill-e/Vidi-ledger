import { eq } from 'drizzle-orm';
import { recurrences } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

// Changing the amount or frequency with `effectiveFrom` after the rule's start
// closes the rule the day before and continues with a new one, so the budget
// of past days stays as it was. Without `effectiveFrom` (or on/before the
// start) the rule is edited in place, which rewrites its whole period.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const rule = await requireRecurrence(event, wallet.id);
    const body = await validateBody(event, recurrenceUpdateSchema);

    const amount = body.amount !== undefined ? toCents(body.amount) : rule.amount;
    const frequency = body.frequency ?? rule.frequency;
    const memo = body.memo !== undefined ? (body.memo || null) : rule.memo;
    const endDate = body.endDate !== undefined ? body.endDate : rule.endDate;
    const valueChanged = amount !== rule.amount || frequency !== rule.frequency;

    // A contribution to a pot must not shrink below what was already spent from it.
    const assertPot = (next: (r: any) => any[]) => rule.potId === null
        ? Promise.resolve()
        : assertPotBalance(wallet, rule.potId, { rules: (current) => current.flatMap((r) => (r.id === rule.id ? next(r) : [r])) });

    if (valueChanged && body.effectiveFrom && body.effectiveFrom > rule.startDate) {
        if (rule.endDate !== null && body.effectiveFrom > rule.endDate) {
            throw createError({ statusCode: 400, statusMessage: 'effectiveFrom: The rule has already ended' });
        }
        if (endDate !== null && endDate < body.effectiveFrom) {
            throw createError({ statusCode: 400, statusMessage: 'endDate: End date must be on or after the start date' });
        }
        await assertPot((r) => [
            { ...r, endDate: addDays(body.effectiveFrom!, -1) },
            { ...r, id: -1, amount, frequency, startDate: body.effectiveFrom!, endDate },
        ]);

        await db.update(recurrences)
            .set({ endDate: addDays(body.effectiveFrom, -1) })
            .where(eq(recurrences.id, rule.id))
            .execute();

        const next = await fetchOne(db.insert(recurrences).values({
            walletId: wallet.id,
            categoryId: rule.categoryId,
            potId: rule.potId,
            kind: rule.kind,
            amount,
            frequency,
            startDate: body.effectiveFrom,
            endDate,
            memo,
        }).returning());

        setResponseStatus(event, 201);
        return next;
    }

    if (endDate !== null && endDate < rule.startDate) {
        throw createError({ statusCode: 400, statusMessage: 'endDate: End date must be on or after the start date' });
    }
    await assertPot((r) => [{ ...r, amount, frequency, endDate }]);

    return fetchOne(db.update(recurrences)
        .set({ amount, frequency, memo, endDate })
        .where(eq(recurrences.id, rule.id))
        .returning());
});
