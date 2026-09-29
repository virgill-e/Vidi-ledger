import { potTransfers } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

// to_pot: put money aside from the budget; from_pot: bring it back.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const pot = await requirePot(wallet.id, Number(getRouterParam(event, 'id')), { statusCode: 404 });
    if (pot.archivedAt) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid pot' });
    }
    const body = await validateBody(event, potTransferCreateSchema);
    assertDateInWallet(wallet, body.date);

    const amount = toCents(body.amount);
    if (body.direction === 'from_pot') await assertPotBalance(wallet, pot.id, { delta: -amount });

    const transfer = await fetchOne(db.insert(potTransfers).values({
        walletId: wallet.id,
        potId: pot.id,
        direction: body.direction,
        amount,
        date: body.date,
        memo: body.memo || null,
    }).returning());

    setResponseStatus(event, 201);
    return transfer;
});
