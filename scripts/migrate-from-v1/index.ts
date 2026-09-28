// One-shot migration of V1 users and investments into a new, empty V2 database.
//
//   V1_DATABASE_URL=<V1 db> DATABASE_URL=<new V2 db> [DB_TYPE=postgres] \
//     npm run migrate:v1 -- [--dry-run] [--start-date=YYYY-MM-DD] [--only=email] [--v1-schema=name]
//
// V1 is only read. The V2 schema must already exist (db:push / migrations)
// and hold no user. --only migrates a single account; --v1-schema reads V1
// tables from another Postgres schema (e.g. V1 moved to "v1" so V2 can live
// in "public" of the same database). Every check runs before writing (and again after, on the
// written rows); any error or mismatch exits with code 1.
// Spec: docs/v2/analyse.md §4.

import Database from 'better-sqlite3';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { assets, categories, transactions, users as usersTable, wallets } from '../../server/database/schema';
import { db, fetchAll, fetchOne } from '../../server/utils/db';
import { seedDefaultCategories } from '../../server/utils/wallet';
import { isLocalDate, todayIn } from '../../shared/utils/dates';
import { computePosition, type Trade } from '../../shared/utils/portfolio';
import {
    compareWithV1, convertTrade, groupByAsset, v1Aggregate,
    type ConvertedTrade, type V1Investment, type V1User,
} from './convert';

const TIMEZONE = 'Europe/Brussels';
const isPostgresUrl = (url: string) => url.startsWith('postgres://') || url.startsWith('postgresql://');

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const startDate = args.find((a) => a.startsWith('--start-date='))?.split('=')[1] ?? todayIn(TIMEZONE);
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length).trim().toLowerCase();
const v1Schema = args.find((a) => a.startsWith('--v1-schema='))?.slice('--v1-schema='.length).trim();
const sourceUrl = process.env.V1_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;

const fail = (message: string): never => {
    console.error(`\n✗ ${message}`);
    process.exit(1);
};

if (!sourceUrl) fail('V1_DATABASE_URL is required (the V1 database, read only).');
if (!targetUrl) fail('DATABASE_URL is required (the new, empty V2 database).');
if (v1Schema !== undefined && !/^[a-z_][a-z0-9_]*$/.test(v1Schema)) fail('--v1-schema must be a plain schema name.');
if (v1Schema !== undefined && !isPostgresUrl(sourceUrl!)) fail('--v1-schema only applies to a Postgres V1 database.');
// Same database only when V1 sits in its own schema, away from V2's "public".
if (sourceUrl === targetUrl && (v1Schema === undefined || v1Schema === 'public')) fail('V1 and V2 share the same database: move V1 to another schema and pass --v1-schema.');
if (!isLocalDate(startDate)) fail(`--start-date must be YYYY-MM-DD (got "${startDate}").`);

// ---------------------------------------------------------------------------
// Read V1 (dates formatted in SQL: V1 stores UTC midnight, never shift them)
// ---------------------------------------------------------------------------

const readV1 = async (): Promise<{ users: V1User[]; investments: V1Investment[] }> => {
    if (isPostgresUrl(sourceUrl!)) {
        const sql = postgres(sourceUrl!, { max: 1, ...(v1Schema ? { connection: { search_path: v1Schema } } : {}) });
        try {
            const u = await sql`SELECT id, email, name, password, role, (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS "createdAt" FROM users ORDER BY id`;
            const i = await sql`SELECT id, user_id AS "userId", type, asset, amount, quantity, to_char(date, 'YYYY-MM-DD') AS date, note FROM investments ORDER BY id`;
            return {
                users: u.map((r: any) => ({ ...r, createdAt: Number(r.createdAt) })),
                investments: i.map((r: any) => ({ ...r, quantity: Number(r.quantity) })),
            };
        } finally {
            await sql.end();
        }
    }
    const sqlite = new Database(sourceUrl!, { readonly: true, fileMustExist: true });
    try {
        return {
            users: sqlite.prepare(`SELECT id, email, name, password, role, created_at * 1000 AS createdAt FROM users ORDER BY id`).all() as V1User[],
            investments: sqlite.prepare(`SELECT id, user_id AS userId, type, asset, amount, quantity, strftime('%Y-%m-%d', date, 'unixepoch') AS date, note FROM investments ORDER BY id`).all() as V1Investment[],
        };
    } finally {
        sqlite.close();
    }
};

// ---------------------------------------------------------------------------
// Plan: convert and check everything before any write
// ---------------------------------------------------------------------------

interface AssetPlan {
    key: string;
    name: string;
    v1: ReturnType<typeof v1Aggregate>;
    trades: ConvertedTrade[];
}

interface UserPlan {
    user: V1User;
    assets: AssetPlan[];
}

/** Keeps a single account (and its rows) when --only is given. */
const selectUsers = (source: Awaited<ReturnType<typeof readV1>>) => {
    if (!only) return source;
    const users = source.users.filter((u) => u.email.trim().toLowerCase() === only);
    if (!users.length) fail(`--only: no V1 account with the email ${only}.`);
    const ids = new Set(users.map((u) => u.id));
    return {
        users,
        investments: source.investments.filter((i) => ids.has(i.userId)),
    };
};

const plan = (source: Awaited<ReturnType<typeof readV1>>) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const mismatches: string[] = [];

    const users: UserPlan[] = source.users.map((user) => {
        const groups = groupByAsset(source.investments.filter((i) => i.userId === user.id));
        const assetsPlan: AssetPlan[] = [];
        for (const [key, group] of groups) {
            const trades: ConvertedTrade[] = [];
            for (const row of group.rows) {
                const result = convertTrade(row);
                if ('error' in result) errors.push(`${user.email}: ${result.error}`);
                else trades.push(result.trade);
            }
            const v1 = v1Aggregate(group.rows);
            const asTrades: Trade[] = trades.map((t) => ({ ...t, id: t.v1Id }));
            for (const issue of compareWithV1(v1, asTrades)) mismatches.push(`${user.email} / ${group.name}: ${issue}`);

            const late = trades.filter((t) => t.date >= startDate);
            if (late.length) warnings.push(`${user.email} / ${group.name}: ${late.length} operation(s) on or after ${startDate} will affect the budget`);

            assetsPlan.push({ key, name: group.name, v1, trades });
        }
        return { user, assets: assetsPlan };
    });

    return { users, errors, warnings, mismatches };
};

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

const write = async (plans: UserPlan[]) => {
    const existing = await fetchOne(db.select({ id: usersTable.id }).from(usersTable).limit(1));
    if (existing) fail('The target database already has users: migrate into a new, empty V2 database.');

    for (const { user, assets: assetPlans } of plans) {
        const created = await fetchOne(db.insert(usersTable).values({
            email: user.email,
            name: user.name,
            passwordHash: user.password,
            isAdmin: user.role === 'admin',
            createdAt: new Date(user.createdAt),
        }).returning());

        const wallet = await fetchOne(db.insert(wallets).values({
            userId: created.id,
            name: 'Mon portefeuille',
            startDate,
            currency: 'EUR',
            timezone: TIMEZONE,
        }).returning());
        await seedDefaultCategories(wallet.id);

        const cats = await fetchAll(db.select().from(categories).where(eq(categories.walletId, wallet.id)));
        const buyCategory = cats.find((c: any) => c.isInvestment && c.kind === 'expense');
        const incomeCategory = cats.find((c: any) => c.isInvestment && c.kind === 'income');

        for (const plan of assetPlans) {
            const asset = await fetchOne(db.insert(assets).values({ walletId: wallet.id, name: plan.name, nameKey: plan.key }).returning());
            if (plan.trades.length) {
                await db.insert(transactions).values(plan.trades.map((t) => ({
                    walletId: wallet.id,
                    categoryId: t.type === 'buy' ? buyCategory.id : incomeCategory.id,
                    type: t.type,
                    date: t.date,
                    amount: t.amount,
                    memo: t.memo,
                    assetId: asset.id,
                    quantity: t.quantity,
                }))).execute();
            }
        }
    }
};
/** Re-reads the written trades and compares them with V1 once more. */
const verifyWritten = async (plans: UserPlan[]) => {
    const issues: string[] = [];
    for (const { user, assets: assetPlans } of plans) {
        const target = await fetchOne(db.select().from(usersTable).where(eq(usersTable.email, user.email)));
        const wallet = target && await fetchOne(db.select().from(wallets).where(eq(wallets.userId, target.id)));
        if (!wallet) {
            issues.push(`${user.email}: not found after writing`);
            continue;
        }
        const written = await fetchAll(db.select().from(transactions).where(eq(transactions.walletId, wallet.id)));
        const writtenAssets = await fetchAll(db.select().from(assets).where(eq(assets.walletId, wallet.id)));
        for (const plan of assetPlans) {
            const asset = writtenAssets.find((a: any) => a.nameKey === plan.key);
            const trades = written.filter((t: any) => t.assetId === asset?.id);
            for (const issue of compareWithV1(plan.v1, trades)) issues.push(`${user.email} / ${plan.name}: ${issue}`);
        }
    }
    return issues;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
    console.log(`V1 → V2 migration${dryRun ? ' (dry run)' : ''} — wallets start on ${startDate} (${TIMEZONE})${only ? ` — only ${only}` : ''}${v1Schema ? ` — V1 schema "${v1Schema}"` : ''}\n`);
    const all = await readV1();
    const source = selectUsers(all);
    if (only) console.log(`(${all.users.length - source.users.length} other V1 account(s) left out)\n`);
    const { users: plans, errors, warnings, mismatches } = plan(source);

    for (const { user, assets: assetPlans } of plans) {
        const tradeCount = assetPlans.reduce((n, a) => n + a.trades.length, 0);
        console.log(`• ${user.email}${user.role === 'admin' ? ' (admin)' : ''} — ${assetPlans.length} asset(s), ${tradeCount} operation(s)`);
        for (const a of assetPlans) {
            const p = computePosition(a.trades.map((t) => ({ ...t, id: t.v1Id })));
            console.log(`    ${a.name}: ${p.quantity / 1e8} unit(s), cost ${(p.costBasis / 100).toFixed(2)}, dividends ${(p.dividends / 100).toFixed(2)}`);
        }
    }
    const skipped = source.investments.filter((i) => !source.users.some((u) => u.id === i.userId));
    if (skipped.length) warnings.push(`${skipped.length} investment(s) belong to no user and are ignored`);

    for (const w of warnings) console.log(`\n⚠ ${w}`);
    for (const e of errors) console.log(`\n✗ ${e}`);
    for (const m of mismatches) console.log(`\n✗ mismatch — ${m}`);
    if (errors.length || mismatches.length) fail(`${errors.length} error(s), ${mismatches.length} mismatch(es): nothing written.`);

    if (dryRun) {
        console.log(`\n✓ Dry run OK: ${plans.length} user(s) ready. Nothing written.`);
        return;
    }

    await write(plans);
    const after = await verifyWritten(plans);
    for (const m of after) console.log(`\n✗ after writing — ${m}`);
    if (after.length) fail('The written data differs from V1: drop the V2 database and investigate.');
    console.log(`\n✓ Migrated ${plans.length} user(s); V2 matches V1.`);
};

main().then(() => process.exit(0), (err) => fail(err?.stack ?? String(err)));
