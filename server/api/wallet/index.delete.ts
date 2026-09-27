import { eq } from 'drizzle-orm';
import { wallets } from '../../database/schema';
import { db } from '../../utils/db';

// Deletes the wallet and, by cascade, all its categories, pots, assets,
// recurrences and transactions. The user account itself is kept.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    await db.delete(wallets).where(eq(wallets.id, wallet.id)).execute();
    return { success: true };
});
