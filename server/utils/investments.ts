import { and, eq } from 'drizzle-orm';
import { assets, categories, transactions } from '../database/schema';
import { db, fetchAll, fetchOne } from './db';

const TRADE_TYPES = ['buy', 'sell', 'dividend'];

/**
 * The wallet's active investment category for a trade: expense side for
 * buys, income side for sells and dividends. Throws 400 otherwise. Auto-imported.
 */
export const requireInvestmentCategory = async (walletId: number, categoryId: number, type: 'buy' | 'sell' | 'dividend') => {
    const category = await fetchOne(db.select().from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.walletId, walletId))));
    const kind = type === 'buy' ? 'expense' : 'income';
    if (!category || !category.isInvestment || category.kind !== kind || category.archivedAt) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid category' });
    }
    return category;
};

export const assetNameKey = (name: string) => name.trim().toLowerCase();

/** Asset by (case-insensitive) name, created on first use. Auto-imported. */
export const findOrCreateAsset = async (walletId: number, name: string) => {
    const nameKey = assetNameKey(name);
    const existing = await fetchOne(db.select().from(assets)
        .where(and(eq(assets.walletId, walletId), eq(assets.nameKey, nameKey))));
    if (existing) return existing;
    return fetchOne(db.insert(assets).values({ walletId, name: name.trim(), nameKey }).returning());
};

export const requireAsset = async (walletId: number, assetId: number, statusCode: 400 | 404 = 400) => {
    const asset = Number.isInteger(assetId) && assetId > 0
        ? await fetchOne(db.select().from(assets).where(and(eq(assets.id, assetId), eq(assets.walletId, walletId))))
        : null;
    if (!asset) {
        throw createError({ statusCode, statusMessage: statusCode === 404 ? 'Asset not found' : 'Invalid asset' });
    }
    return asset;
};

/** Buys, sells and dividends of one asset, in no particular order. */
export const assetTrades = async (walletId: number, assetId: number) =>
    fetchAll(db.select().from(transactions).where(and(eq(transactions.walletId, walletId), eq(transactions.assetId, assetId))))
        .then((rows: any[]) => rows.filter((r) => TRADE_TYPES.includes(r.type)));

/**
 * Throws 400 if, with `replace` applied (a trade created or edited) and/or
 * `excludeId` removed, a sale would exceed the units held at its date.
 * Auto-imported.
 */
export const assertNoOversell = async (
    walletId: number,
    assetId: number | null,
    change: { excludeId?: number; replace?: Trade } = {},
) => {
    if (assetId === null) return;
    const trades: Trade[] = (await assetTrades(walletId, assetId))
        .filter((t: any) => t.id !== change.excludeId && t.id !== change.replace?.id);
    if (change.replace) trades.push(change.replace);
    if (firstOversell(trades) !== -1) {
        throw createError({ statusCode: 400, statusMessage: 'Quantity exceeds the units held at that date' });
    }
};
