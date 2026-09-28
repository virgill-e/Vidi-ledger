import { and, eq, inArray } from 'drizzle-orm';
import { assets, transactions } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// Every asset of the wallet with its position; open positions first.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const [rows, trades] = await Promise.all([
        fetchAll(db.select().from(assets).where(eq(assets.walletId, wallet.id))),
        fetchAll(db.select().from(transactions).where(and(
            eq(transactions.walletId, wallet.id),
            inArray(transactions.type, ['buy', 'sell', 'dividend']),
        ))),
    ]);

    const result = rows.map((asset: any) => {
        const own = trades.filter((t: any) => t.assetId === asset.id);
        return {
            ...asset,
            position: computePosition(own),
            tradeCount: own.length,
            lastTradeDate: own.reduce((max: string | null, t: any) => (!max || t.date > max ? t.date : max), null),
        };
    });

    return result.sort((a: any, b: any) =>
        Number(b.position.quantity > 0) - Number(a.position.quantity > 0) || b.position.costBasis - a.position.costBasis || a.name.localeCompare(b.name));
});
