import { eq } from 'drizzle-orm';
import { transactions } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const tx = await requireTransaction(event, wallet.id);
    // Removing money credited to a pot must not leave it negative.
    if (tx.potId !== null && !isOutflow(tx.type)) {
        await assertPotBalance(wallet, tx.potId, { excludeTransactionId: tx.id });
    }
    // Removing a buy must not leave a later sale without units.
    if (tx.type === 'buy') await assertNoOversell(wallet.id, tx.assetId, { excludeId: tx.id });

    await db.delete(transactions).where(eq(transactions.id, tx.id)).execute();
    return { success: true };
});
