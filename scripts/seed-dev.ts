// Demo data for a local SQLite database (npm run db:seed, after npm run db:push).
// Refuses Postgres URLs and databases that already have users.
//
// Demo account (local only): demo@vidi.local / vidi-demo-2026 — admin, so the
// admin view can be tried too.
//
// Scenario, relative to today (Europe/Brussels): wallet started 10 days ago,
// 2 335 € salary and 1 121 € of monthly charges (the reference screenshots),
// a few expenses (one spread over 3 days), a holiday pot, and a VWCE / BTC
// portfolio whose first trades predate the wallet (no budget impact).

import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { assetPrices, assets, categories, potTransfers, pots, recurrences, transactions, users, wallets } from '../server/database/schema';
import { db, fetchAll, fetchOne } from '../server/utils/db';
import { seedDefaultCategories } from '../server/utils/wallet';
import { addDays, todayIn } from '../shared/utils/dates';
import { QUANTITY_SCALE, UNIT_PRICE_SCALE } from '../shared/utils/portfolio';

const DEMO_EMAIL = 'demo@vidi.local';
const DEMO_PASSWORD = 'vidi-demo-2026';
const TIMEZONE = 'Europe/Brussels';

const fail = (message: string): never => {
    console.error(`✗ ${message}`);
    process.exit(1);
};

const url = process.env.DATABASE_URL ?? 'sqlite.db';
if (process.env.DB_TYPE === 'postgres' || /^postgres(ql)?:\/\//.test(url)) fail('Demo seed is for a local SQLite database only.');
if (url === 'sqlite.db') fail('Set DATABASE_URL to a V2 database (e.g. v2-local.db in .env), not the V1 default sqlite.db.');

const main = async () => {
    if (await fetchOne(db.select({ id: users.id }).from(users).limit(1))) fail(`${url} already has users: delete the file, run npm run db:push, then seed again.`);

    const today = todayIn(TIMEZONE);
    const day = (offset: number) => addDays(today, offset);
    const start = day(-10);

    const user = await fetchOne(db.insert(users).values({
        email: DEMO_EMAIL,
        name: 'Démo',
        passwordHash: await hash(DEMO_PASSWORD, 10),
        isAdmin: true,
    }).returning());

    const wallet = await fetchOne(db.insert(wallets).values({
        userId: user.id, name: 'Mon portefeuille', startDate: start, currency: 'EUR', timezone: TIMEZONE,
    }).returning());
    await seedDefaultCategories(wallet.id);
    const cats = await fetchAll(db.select().from(categories).where(eq(categories.walletId, wallet.id)));
    const cat = (name: string) => cats.find((c: any) => c.name === name).id;

    await db.insert(recurrences).values([
        { walletId: wallet.id, categoryId: cat('Salaire'), kind: 'income', amount: 233_500, frequency: 'monthly', startDate: start },
        { walletId: wallet.id, categoryId: cat('Logement'), kind: 'expense', amount: 90_000, frequency: 'monthly', startDate: start, memo: 'Loyer' },
        { walletId: wallet.id, categoryId: cat('Charges'), kind: 'expense', amount: 22_100, frequency: 'monthly', startDate: start, memo: 'Énergie & internet' },
    ]).execute();

    const pot = await fetchOne(db.insert(pots).values({
        walletId: wallet.id, name: 'Vacances', icon: 'lucide:plane', color: '#0ea5e9', targetAmount: 150_000,
    }).returning());
    await db.insert(potTransfers).values({ walletId: wallet.id, potId: pot.id, direction: 'to_pot', amount: 12_000, date: day(-3) }).execute();

    await db.insert(transactions).values([
        { walletId: wallet.id, categoryId: cat('Courses'), type: 'expense', date: day(-9), amount: 4_230, memo: 'Delhaize' },
        { walletId: wallet.id, categoryId: cat('Sorties & restaurants'), type: 'expense', date: day(-6), amount: 2_450, memo: 'Pizza' },
        { walletId: wallet.id, categoryId: cat('Loisirs'), type: 'expense', date: day(-2), amount: 9_000, memo: 'Concert', spreadDays: 3 },
        { walletId: wallet.id, categoryId: cat('Transports'), type: 'expense', date: day(-1), amount: 4_000, memo: 'Train', potId: pot.id },
        { walletId: wallet.id, categoryId: cat('Courses'), type: 'expense', date: today, amount: 1_000 },
    ]).execute();

    const q = (units: number) => Math.round(units * QUANTITY_SCALE);
    const vwce = await fetchOne(db.insert(assets).values({ walletId: wallet.id, name: 'VWCE', nameKey: 'vwce', ticker: 'IE00BK5BQT80', assetClass: 'etf' }).returning());
    const btc = await fetchOne(db.insert(assets).values({ walletId: wallet.id, name: 'Bitcoin', nameKey: 'bitcoin', ticker: 'BTC', assetClass: 'crypto' }).returning());
    const buy = cat('Investissement');
    const income = cat("Revenus d'investissement");
    await db.insert(transactions).values([
        { walletId: wallet.id, categoryId: buy, type: 'buy', date: day(-120), amount: 20_100, assetId: vwce.id, quantity: q(2), memo: 'Premier achat' },
        { walletId: wallet.id, categoryId: buy, type: 'buy', date: day(-60), amount: 11_000, assetId: vwce.id, quantity: q(1) },
        { walletId: wallet.id, categoryId: income, type: 'sell', date: day(-30), amount: 12_000, assetId: vwce.id, quantity: q(1) },
        { walletId: wallet.id, categoryId: income, type: 'dividend', date: day(-20), amount: 300, assetId: vwce.id },
        { walletId: wallet.id, categoryId: buy, type: 'buy', date: day(-4), amount: 15_750, assetId: vwce.id, quantity: q(1.5) },
        { walletId: wallet.id, categoryId: buy, type: 'buy', date: day(-90), amount: 5_000, assetId: btc.id, quantity: q(0.00123456) },
    ]).execute();
    await db.insert(assetPrices).values([
        { assetId: vwce.id, date: day(-45), unitPrice: 102.3 * UNIT_PRICE_SCALE },
        { assetId: vwce.id, date: day(-1), unitPrice: 116 * UNIT_PRICE_SCALE },
    ]).execute();

    console.log(`✓ Demo data in ${url} — log in with ${DEMO_EMAIL} (password in scripts/seed-dev.ts).`);
};

main().then(() => process.exit(0), (err) => fail(err?.stack ?? String(err)));
