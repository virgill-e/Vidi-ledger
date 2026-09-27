import { and, eq, inArray } from 'drizzle-orm';
import { assetPrices, assets, transactions } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// Every asset of the wallet with its position; open positions first.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const [rows, trades, quotes] = await Promise.all([
        fetchAll(db.select().from(assets).where(eq(assets.walletId, wallet.id))),
        fetchAll(db.select().from(transactions).where(and(
            eq(transactions.walletId, wallet.id),
            inArray(transactions.type, ['buy', 'sell', 'dividend']),
        ))),
        fetchAll(db.select({ assetId: assetPrices.assetId, date: assetPrices.date, unitPrice: assetPrices.unitPrice })
            .from(assetPrices).innerJoin(assets, eq(assets.id, assetPrices.assetId)).where(eq(assets.walletId, wallet.id))),
    ]);

    const result = rows.map((asset: any) => {
        const own = trades.filter((t: any) => t.assetId === asset.id);
        const latest = quotes.filter((q: any) => q.assetId === asset.id).sort((a: any, b: any) => (a.date < b.date ? 1 : -1))[0] ?? null;
        return {
            ...asset,
            position: computePosition(own, latest),
            tradeCount: own.length,
            lastTradeDate: own.reduce((max: string | null, t: any) => (!max || t.date > max ? t.date : max), null),
        };
    });

    const weight = (a: any) => a.position.value ?? a.position.costBasis;
    return result.sort((a: any, b: any) =>
        Number(b.position.quantity > 0) - Number(a.position.quantity > 0) || weight(b) - weight(a) || a.name.localeCompare(b.name));
});
