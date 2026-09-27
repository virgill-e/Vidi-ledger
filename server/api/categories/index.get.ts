import { asc, eq } from 'drizzle-orm';
import { categories } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// All categories of the wallet, archived ones included (`archivedAt` set).
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    return fetchAll(db.select().from(categories)
        .where(eq(categories.walletId, wallet.id))
        .orderBy(asc(categories.position), asc(categories.id)));
});
