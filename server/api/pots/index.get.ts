import { asc, eq } from 'drizzle-orm';
import { pots } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// All pots (archived included) with their current balance.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const [rows, { balances }] = await Promise.all([
        fetchAll(db.select().from(pots).where(eq(pots.walletId, wallet.id)).orderBy(asc(pots.position), asc(pots.id))),
        walletPotBalances(wallet.id),
    ]);
    return rows.map((p: any) => ({ ...p, balance: balances.get(p.id) ?? 0 }));
});
