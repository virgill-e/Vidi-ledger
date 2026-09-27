import { and, eq } from 'drizzle-orm';
import { assetPrices, assets } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const id = Number(getRouterParam(event, 'id'));
    const price = Number.isInteger(id) && id > 0
        ? await fetchOne(db.select({ id: assetPrices.id }).from(assetPrices)
            .innerJoin(assets, eq(assets.id, assetPrices.assetId))
            .where(and(eq(assetPrices.id, id), eq(assets.walletId, wallet.id))))
        : null;
    if (!price) throw createError({ statusCode: 404, statusMessage: 'Price not found' });

    await db.delete(assetPrices).where(eq(assetPrices.id, price.id)).execute();
    return { success: true };
});
