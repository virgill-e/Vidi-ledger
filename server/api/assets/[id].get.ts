import { asc, eq } from 'drizzle-orm';
import { assetPrices } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// Asset detail: position, trades (with unit price), manual quotes and PRU
// history — everything the price chart needs.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const asset = await requireAsset(wallet.id, Number(getRouterParam(event, 'id')), 404);

    const [trades, prices] = await Promise.all([
        assetTrades(wallet.id, asset.id),
        fetchAll(db.select().from(assetPrices).where(eq(assetPrices.assetId, asset.id)).orderBy(asc(assetPrices.date))),
    ]);
    const sorted = sortTrades(trades);

    return {
        asset,
        position: computePosition(sorted, prices.at(-1) ?? null),
        trades: sorted.map((t: any) => ({ ...t, unitPrice: tradeUnitPrice(t) })).reverse(),
        prices,
        averageCostHistory: averageCostHistory(sorted),
    };
});
