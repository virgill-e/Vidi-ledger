import { and, eq, ne } from 'drizzle-orm';
import { assets } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const asset = await requireAsset(wallet.id, Number(getRouterParam(event, 'id')), 404);
    const body = await validateBody(event, assetUpdateSchema);

    const changes: Record<string, unknown> = {};
    if (body.name !== undefined) {
        const nameKey = assetNameKey(body.name);
        const clash = await fetchOne(db.select({ id: assets.id }).from(assets)
            .where(and(eq(assets.walletId, wallet.id), eq(assets.nameKey, nameKey), ne(assets.id, asset.id))));
        if (clash) throw createError({ statusCode: 409, statusMessage: 'An asset already has this name' });
        changes.name = body.name;
        changes.nameKey = nameKey;
    }
    if (body.ticker !== undefined) changes.ticker = body.ticker || null;
    if (body.assetClass !== undefined) changes.assetClass = body.assetClass;
    if (Object.keys(changes).length === 0) return asset;

    return fetchOne(db.update(assets).set(changes).where(eq(assets.id, asset.id)).returning());
});
