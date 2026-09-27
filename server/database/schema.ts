import { sql } from 'drizzle-orm';
import {
    sqliteTable,
    text as sqliteText,
    integer as sqliteInteger,
    index as sqliteIndex,
    uniqueIndex as sqliteUniqueIndex,
    check as sqliteCheck,
} from 'drizzle-orm/sqlite-core';
import {
    pgTable,
    text as pgText,
    integer as pgInteger,
    bigint as pgBigint,
    boolean as pgBoolean,
    serial as pgSerial,
    timestamp as pgTimestamp,
    index as pgIndex,
    uniqueIndex as pgUniqueIndex,
    check as pgCheck,
} from 'drizzle-orm/pg-core';

// Check if we are using Postgres based on the environment
const usePostgres = process.env.DB_TYPE === 'postgres' || process.env.DATABASE_URL?.startsWith('postgres://') || process.env.DATABASE_URL?.startsWith('postgresql://');

// ----------------------------------------------------------------------------
// Dialect helpers — never call sqliteTable/pgTable (or their column builders)
// directly below, so the same schema works on SQLite (local) and Postgres (prod).
// ----------------------------------------------------------------------------

// `extra` receives the columns and returns indexes/checks built with the
// `index` / `uniqueIndex` / `check` helpers below. Typed `any`: a union of both
// dialects' table types is not usable by drizzle's query builders anyway.
const table = (name: string, columns: any, extra?: (t: any) => any[]): any => {
    return usePostgres ? pgTable(name, columns, extra as any) : sqliteTable(name, columns, extra as any);
};

const index = (name: string): any => usePostgres ? pgIndex(name) : sqliteIndex(name);
const uniqueIndex = (name: string): any => usePostgres ? pgUniqueIndex(name) : sqliteUniqueIndex(name);
const check = (name: string, expr: ReturnType<typeof sql>): any => usePostgres ? pgCheck(name, expr) : sqliteCheck(name, expr);

const text = (name: string) => usePostgres ? pgText(name) : sqliteText(name);

// Primary key helper
const idColumn = (name: string) => {
    if (usePostgres) {
        return pgSerial(name).primaryKey();
    } else {
        return sqliteInteger(name).primaryKey({ autoIncrement: true });
    }
};

// Timestamp helper — technical timestamps only (created_at, updated_at, …).
const dateColumn = (name: string) => {
    if (usePostgres) {
        return pgTimestamp(name, { mode: 'date' });
    } else {
        return sqliteInteger(name, { mode: 'timestamp_ms' });
    }
};

// Business date helper: 'YYYY-MM-DD' in the wallet's timezone. Stored as text
// so there is no timezone shift and lexicographic order = chronological order.
const localDate = (name: string) => text(name);

// 32-bit integer: money in cents, foreign keys, counters.
const int = (name: string) => usePostgres ? pgInteger(name) : sqliteInteger(name);

// 64-bit integer read as a JS number: quantities (×10⁸) and unit prices (×10⁶).
const bigint = (name: string) => usePostgres ? pgBigint(name, { mode: 'number' }) : sqliteInteger(name);

const bool = (name: string) => usePostgres ? pgBoolean(name) : sqliteInteger(name, { mode: 'boolean' });

const createdAt = () => dateColumn('created_at').notNull().$defaultFn(() => new Date());
const updatedAt = () => dateColumn('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date());

// Fixed-point scales of the bigint columns (transactions.quantity ×10⁸,
// asset_prices.unit_price ×10⁶) live in shared/utils/portfolio.ts.

// ----------------------------------------------------------------------------
// Accounts
// ----------------------------------------------------------------------------

export const users = table('users', {
    id: idColumn('id'),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    isAdmin: bool('is_admin').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const sessions = table('sessions', {
    id: text('id').primaryKey(),
    userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    createdAt: createdAt(),
    lastActiveAt: dateColumn('last_active_at').notNull().$defaultFn(() => new Date()),
    expiresAt: dateColumn('expires_at').notNull(),
}, (t) => [
    index('sessions_user_idx').on(t.userId),
]);

// ----------------------------------------------------------------------------
// Wallet (one per user) and its configuration
// ----------------------------------------------------------------------------

export const wallets = table('wallets', {
    id: idColumn('id'),
    userId: int('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    startDate: localDate('start_date').notNull(),
    endDate: localDate('end_date'),
    currency: text('currency').notNull().default('EUR'), // ISO 4217
    timezone: text('timezone').notNull().default('Europe/Brussels'), // IANA
    createdAt: createdAt(),
    updatedAt: updatedAt(),
}, (t) => [
    check('wallets_dates_check', sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate}`),
]);

export const categories = table('categories', {
    id: idColumn('id'),
    walletId: int('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'expense' | 'income'
    isInvestment: bool('is_investment').notNull().default(false),
    name: text('name').notNull(),
    icon: text('icon').notNull(), // Iconify key, e.g. 'lucide:shopping-cart'
    color: text('color').notNull(),
    position: int('position').notNull().default(0),
    archivedAt: dateColumn('archived_at'),
    createdAt: createdAt(),
}, (t) => [
    index('categories_wallet_idx').on(t.walletId),
    check('categories_kind_check', sql`${t.kind} IN ('expense', 'income')`),
]);

export const pots = table('pots', {
    id: idColumn('id'),
    walletId: int('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    targetAmount: int('target_amount'), // In cents
    position: int('position').notNull().default(0),
    archivedAt: dateColumn('archived_at'),
    createdAt: createdAt(),
}, (t) => [
    index('pots_wallet_idx').on(t.walletId),
    check('pots_target_check', sql`${t.targetAmount} IS NULL OR ${t.targetAmount} > 0`),
]);

// ----------------------------------------------------------------------------
// Investments
// ----------------------------------------------------------------------------

export const assets = table('assets', {
    id: idColumn('id'),
    walletId: int('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(), // lower-cased name, for case-insensitive uniqueness
    ticker: text('ticker'),
    assetClass: text('asset_class'), // 'etf' | 'stock' | 'crypto' | 'bond' | 'other'
    createdAt: createdAt(),
}, (t) => [
    uniqueIndex('assets_wallet_name_key_idx').on(t.walletId, t.nameKey),
    check('assets_class_check', sql`${t.assetClass} IS NULL OR ${t.assetClass} IN ('etf', 'stock', 'crypto', 'bond', 'other')`),
]);

// Manually entered quotes; the latest one is the asset's current price.
export const assetPrices = table('asset_prices', {
    id: idColumn('id'),
    assetId: int('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
    date: localDate('date').notNull(),
    unitPrice: bigint('unit_price').notNull(), // × UNIT_PRICE_SCALE
    createdAt: createdAt(),
}, (t) => [
    uniqueIndex('asset_prices_asset_date_idx').on(t.assetId, t.date),
    check('asset_prices_unit_price_check', sql`${t.unitPrice} > 0`),
]);

// ----------------------------------------------------------------------------
// Money movements
// ----------------------------------------------------------------------------

// Recurring incomes/expenses, smoothed per day into the daily allowance.
// Always charged to the budget (never to a pot).
export const recurrences = table('recurrences', {
    id: idColumn('id'),
    walletId: int('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
    categoryId: int('category_id').notNull().references(() => categories.id),
    kind: text('kind').notNull(), // 'expense' | 'income'
    amount: int('amount').notNull(), // In cents
    frequency: text('frequency').notNull(), // 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate: localDate('start_date').notNull(),
    endDate: localDate('end_date'),
    memo: text('memo'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
}, (t) => [
    index('recurrences_wallet_idx').on(t.walletId),
    check('recurrences_kind_check', sql`${t.kind} IN ('expense', 'income')`),
    check('recurrences_frequency_check', sql`${t.frequency} IN ('daily', 'weekly', 'monthly', 'yearly')`),
    check('recurrences_amount_check', sql`${t.amount} > 0`),
    check('recurrences_dates_check', sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate}`),
]);

// One-off movements. The sign comes from `type`; `pot_id` null = budget.
// Type ↔ category consistency (investment flag, kind) is enforced by the API.
export const transactions = table('transactions', {
    id: idColumn('id'),
    walletId: int('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
    categoryId: int('category_id').notNull().references(() => categories.id),
    type: text('type').notNull(), // 'expense' | 'income' | 'buy' | 'sell' | 'dividend'
    date: localDate('date').notNull(),
    amount: int('amount').notNull(), // In cents, fees included
    memo: text('memo'),
    potId: int('pot_id').references(() => pots.id),
    spreadDays: int('spread_days').notNull().default(1),
    assetId: int('asset_id').references(() => assets.id),
    quantity: bigint('quantity'), // × QUANTITY_SCALE
    fees: int('fees').notNull().default(0), // In cents
    createdAt: createdAt(),
    updatedAt: updatedAt(),
}, (t) => [
    index('transactions_wallet_date_idx').on(t.walletId, t.date),
    index('transactions_asset_date_idx').on(t.assetId, t.date),
    check('transactions_type_check', sql`${t.type} IN ('expense', 'income', 'buy', 'sell', 'dividend')`),
    check('transactions_amount_check', sql`${t.amount} > 0`),
    check('transactions_fees_check', sql`${t.fees} >= 0`),
    check('transactions_spread_check', sql`${t.spreadDays} = 1 OR (${t.type} = 'expense' AND ${t.spreadDays} > 1)`),
    check('transactions_investment_check', sql`
        (${t.type} IN ('buy', 'sell') AND ${t.assetId} IS NOT NULL AND ${t.quantity} IS NOT NULL AND ${t.quantity} > 0)
        OR (${t.type} = 'dividend' AND ${t.assetId} IS NOT NULL AND (${t.quantity} IS NULL OR ${t.quantity} >= 0))
        OR (${t.type} IN ('expense', 'income') AND ${t.assetId} IS NULL AND ${t.quantity} IS NULL)
    `),
]);

export const potTransfers = table('pot_transfers', {
    id: idColumn('id'),
    walletId: int('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
    potId: int('pot_id').notNull().references(() => pots.id),
    direction: text('direction').notNull(), // 'to_pot' (budget → pot) | 'from_pot' (pot → budget)
    amount: int('amount').notNull(), // In cents
    date: localDate('date').notNull(),
    memo: text('memo'),
    createdAt: createdAt(),
}, (t) => [
    index('pot_transfers_wallet_date_idx').on(t.walletId, t.date),
    check('pot_transfers_direction_check', sql`${t.direction} IN ('to_pot', 'from_pot')`),
    check('pot_transfers_amount_check', sql`${t.amount} > 0`),
]);
