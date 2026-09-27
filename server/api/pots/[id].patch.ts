import { eq } from 'drizzle-orm';
import { pots } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const pot = await requirePot(wallet.id, Number(getRouterParam(event, 'id')), { statusCode: 404 });
    const { archived, targetAmount, ...fields } = await validateBody(event, potUpdateSchema);

    const changes: Record<string, unknown> = { ...fields };
    if (targetAmount !== undefined) changes.targetAmount = targetAmount === null ? null : toCents(targetAmount);
    if (archived !== undefined) {
        // Money left in a pot would silently disappear from the savings total.
        if (archived && ((await walletPotBalances(wallet.id)).balances.get(pot.id) ?? 0) !== 0) {
            throw createError({ statusCode: 400, statusMessage: 'Empty the pot before archiving it' });
        }
        changes.archivedAt = archived ? new Date() : null;
    }
    if (Object.keys(changes).length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Nothing to update' });
    }

    return fetchOne(db.update(pots).set(changes).where(eq(pots.id, pot.id)).returning());
});
