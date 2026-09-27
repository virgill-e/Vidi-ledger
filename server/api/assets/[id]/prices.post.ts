import { assetPrices } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

// Manual quote; one per asset and day (a second entry replaces the first).
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const asset = await requireAsset(wallet.id, Number(getRouterParam(event, 'id')), 404);
    const body = await validateBody(event, assetPriceSchema);

    const price = await fetchOne(db.insert(assetPrices)
        .values({ assetId: asset.id, date: body.date, unitPrice: body.unitPrice })
        .onConflictDoUpdate({ target: [assetPrices.assetId, assetPrices.date], set: { unitPrice: body.unitPrice } })
        .returning());

    setResponseStatus(event, 201);
    return price;
});
