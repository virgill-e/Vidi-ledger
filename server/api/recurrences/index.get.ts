import { asc, desc, eq } from 'drizzle-orm';
import { recurrences } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// All rules, ended ones included (`endDate` in the past).
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    return fetchAll(db.select().from(recurrences)
        .where(eq(recurrences.walletId, wallet.id))
        .orderBy(asc(recurrences.kind), desc(recurrences.startDate), desc(recurrences.id)));
});
