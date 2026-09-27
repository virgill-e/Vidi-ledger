import { and, eq } from 'drizzle-orm';
import { potTransfers } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const id = Number(getRouterParam(event, 'id'));
    const transfer = Number.isInteger(id) && id > 0
        ? await fetchOne(db.select().from(potTransfers).where(and(eq(potTransfers.id, id), eq(potTransfers.walletId, wallet.id))))
        : null;
    if (!transfer) {
        throw createError({ statusCode: 404, statusMessage: 'Transfer not found' });
    }

    // Undoing a deposit must not leave the pot negative.
    if (transfer.direction === 'to_pot') await assertPotBalance(wallet.id, transfer.potId, { excludeTransferId: transfer.id });

    await db.delete(potTransfers).where(eq(potTransfers.id, transfer.id)).execute();
    return { success: true };
});
