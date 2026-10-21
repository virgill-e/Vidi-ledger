import { transactions } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

// Buy (investment expense category) or sell/dividend/reward/fee (investment
// income category). Dates may precede the wallet start to record past trades;
// those do not affect the budget. A reward (staking, airdrop) adds units at no
// cost, a fee paid in units (unstaking…) takes some: neither touches the budget
// nor a pot.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const body = await validateBody(event, investmentCreateSchema);

    await requireInvestmentCategory(wallet.id, body.categoryId, body.type);
    const asset = body.assetId !== undefined
        ? await requireAsset(wallet.id, body.assetId)
        : await findOrCreateAsset(wallet.id, body.assetName!);

    const amount = unitsOnly(body.type) ? 0 : toCents(body.amount!);
    const quantity = body.type === 'dividend' ? (body.quantity ?? null) : body.quantity!;
    const potId = body.potId ?? null;
    if (potId !== null) {
        await requirePot(wallet.id, potId, { active: true });
        if (body.type === 'buy') await assertPotBalance(wallet, potId, { delta: -amount });
    }
    if (removesUnits(body.type)) {
        await assertNoOversell(wallet.id, asset.id, {
            replace: { id: Number.MAX_SAFE_INTEGER, type: body.type, date: body.date, amount, quantity },
        });
    }

    const created = await fetchOne(db.insert(transactions).values({
        walletId: wallet.id,
        categoryId: body.categoryId,
        type: body.type,
        date: body.date,
        amount,
        memo: body.memo || null,
        potId,
        assetId: asset.id,
        quantity,
    }).returning());

    setResponseStatus(event, 201);
    return created;
});
