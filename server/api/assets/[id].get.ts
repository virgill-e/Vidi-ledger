// Asset detail: position, trades (with unit price) and PRU history — everything
// the buy/sell price chart needs.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const asset = await requireAsset(wallet.id, Number(getRouterParam(event, 'id')), 404);

    const sorted = sortTrades(await assetTrades(wallet.id, asset.id));

    return {
        asset,
        position: computePosition(sorted),
        trades: sorted.map((t: any) => ({ ...t, unitPrice: tradeUnitPrice(t) })).reverse(),
        averageCostHistory: averageCostHistory(sorted),
    };
});
