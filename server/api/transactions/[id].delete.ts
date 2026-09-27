import { eq } from 'drizzle-orm';
import { transactions } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const tx = await requireTransaction(event, wallet.id);
    await db.delete(transactions).where(eq(transactions.id, tx.id)).execute();
    return { success: true };
});
