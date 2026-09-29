# CLAUDE.md

## Branches
- `main`: V2 (full rewrite, spec in `docs/v2/analyse.md`). Work on `V2/<feature>` branches, PR into `main`.
- `V1/main`: frozen V1, fixes only. Prod V1 is built from it until the V2 switch.

## Stack
Nuxt 4 (Vue 3, Nitro) + TypeScript. Tailwind CSS 4. Drizzle ORM (SQLite local / Postgres prod). Auth: nuxt-auth-utils. Validation: zod. Icons: @nuxt/icon (lucide, bundled locally). Runtime: Node 22+, npm.

## Commands
- dev: `npm run dev`
- build: `npm run build`
- db push schema: `npm run db:push`
- db gen migration: `npm run db:generate` (always Postgres dialect)
- db studio: `npm run db:studio`
- demo data (local SQLite only): `npm run db:seed` (`scripts/seed-dev.ts`, holds the demo login)
- typecheck: `npx nuxt typecheck`
- tests: `npm test` (vitest, `tests/`)
- V1 → V2 migration: `V1_DATABASE_URL=… DATABASE_URL=… npm run migrate:v1 -- --dry-run [--start-date=YYYY-MM-DD]` (`scripts/migrate-from-v1/`, run with tsx; see README)

## Structure
- `docs/v2/analyse.md`: V2 spec — source of truth for budget rules and the data model.
- `app/`: Nuxt frontend (auto-imported). Subdirs below.
- `app/pages/`: file-based routes (`add/` picker + form, `history`, `transactions/[id]`, `recurrences/[id]`, `pots/` list, detail, transfer, recurring (programmed contribution), edit, `invest/[categoryId]` + `trades/[id]` (trade form), `investments/` portfolio + asset, `settings/` (+ `password`), `admin/`). `app/components/`: TheHeader, SheetHeader, WalletForm, CategoryTile, KindTabs, AmountInput, DateChoice, SelectRow, ConfirmDelete, BudgetChart, IconColorPicker, PotForm, PotProgress, InvestmentForm, PriceChart, MetricCell; `app/components/ui/`: Button, Input, Toggle, Group, Segmented.
- `app/utils/`: `money.ts` (`parseAmount`, `centsToInput`), `labels.ts`, `categoryStyles.ts`.
- `app/layouts/`: `default` (gradient app shell + header), `sheet` (white panel over the gradient, with `SheetHeader`), `auth` (centered card: login, onboarding).
- `app/middleware/`: `wallet` (signed-in with a wallet — default for app pages), `onboarding` (signed-in without wallet), `auth` (signed-in), `guest` (signed-out), `admin`.
- `app/composables/`: shared state (useState): `useWallet`, `useCategories` (reset both on login/logout), `useFormat` (`formatMoney` in the wallet currency), `useLastAdded` (home flash after saving). `app/assets/css/main.css`: theme tokens.
- `server/api/`: Nitro endpoints, named `<resource>.<method>.ts` (e.g. `index.post.ts`). `budget.get.ts` runs the engine from today over `?days=N`.
- `server/database/schema.ts`: dual-dialect Drizzle schema. `server/utils/db.ts`: `db`, `fetchOne`, `fetchAll`.
- `server/utils/`: `wallet.ts` (`requireWallet`, default categories), `categories.ts` (`requireMovementCategory`, `assertDateInWallet`, `toCents`), `movements.ts` (`requireTransaction`, `requireRecurrence`), `pots.ts` (`walletPotBalances`, `requirePot`, `assertPotBalance`, `assertPotsAfterEdit`, `potHasActiveRule` — balances as of today, including recurring contributions), `investments.ts` (`requireInvestmentCategory`, `findOrCreateAsset`, `assertNoOversell`), `admin.ts` (`requireManageableUser`).
- `server/middleware/`: global (rateLimit). `shared/types/`: shared TS types + `auth.d.ts` (User session).
- `shared/utils/`: pure logic auto-imported in app + server — `dates.ts` ('YYYY-MM-DD' helpers, `todayIn`), `budget.ts` (daily budget engine), `pots.ts` (pot balances, `recurringPotCredits`), `portfolio.ts` (positions, PRU, exact decimal parsing, scales). Import explicitly between shared files and in tests.

## Rules
- Money stored as integer cents, always positive (the sign comes from the row type). Multiply on write (`Math.round(amount * 100)`), divide on read.
- Business dates are `'YYYY-MM-DD'` text in the wallet's timezone (`localDate`); timestamps only for `created_at`/`updated_at`/`archived_at`.
- Quantities: `bigint` × `QUANTITY_SCALE` (10⁸) — constant and `parseScaled`/`formatScaled` in `shared/utils/portfolio.ts`. Never floats; send quantities to the API as decimal text. Positions are followed at cost: no market value or quotes.
- Schema must stay dialect-agnostic: use the helpers in `schema.ts` (`table` — 3rd arg for `index`/`uniqueIndex`/`check` —, `text`, `int`, `bigint`, `bool`, `localDate`, `dateColumn`, `idColumn`), never raw `sqliteTable`/`pgTable`.
- DB queries: use `fetchOne`/`fetchAll` from `server/utils/db.ts`, never call `.all()`/`.get()` directly (Postgres lacks them).
- Every API handler: guard with `const user = await requireAuth(event)` (auto-imported from `server/utils/auth.ts`) → throws 401 if no session, returns `{ id, email, name, isAdmin }`. Admin-only routes: `await requireAdmin(event)` (401/403, flag read from the DB). The first admin is set by hand (`UPDATE users SET is_admin = true …`) or migrated from V1; admin actions never target admin accounts.
- Data is scoped by wallet (`wallet_id`); one wallet per user (`wallets.user_id` unique). Wallet-scoped handlers start with `const { user, wallet } = await requireWallet(event)` (404 if none), then filter every query by `wallet.id`.
- Validate request bodies with `validateBody(event, schema)` (auto-imported from `server/utils/validation.ts`); define/reuse a Zod schema there rather than hand-rolling `if (!field)` checks. Route params (`getRouterParam`) are still guarded inline.
- Frontend: `<script setup lang="ts">`, Composition API, typed `defineProps`. Tailwind utility classes only. Icons: `<Icon name="lucide:…" />`.
- Prefer Nuxt auto-imports (no manual import of `ref`, `useState`, `db` helpers where auto-imported). Restart `nuxt dev` after adding exports to `shared/utils` (the auto-import registry does not pick them up live).
- After schema changes run `npm run db:generate` (commit migration) then `npm run db:push` (local SQLite). Production applies pending migrations at startup (`server/utils/migrations.ts`, blocking middleware `server/middleware/0.migrations.ts` → 503 on failure): each migration must stay compatible with the previous code, which still serves while it runs. On SQLite, `db:push` can fail when a change rebuilds a table ("index … already exists"): for local data, back up the file first; the simple path is `rm v2-local.db && npm run db:push && npm run db:seed`.

## Never
- Edit generated dirs: `.nuxt/`, `.output/`, `.nitro/`, `node_modules/`, `server/database/migrations/` (regenerate via drizzle-kit).
- Touch `sqlite.db` or commit it; never commit `.env` or print secret values.
- Point V2 (`db:push`, migrations, the app) at the V1 database — V2 uses a new database; V1 data comes in via the migration script only.
- Hardcode a single DB dialect — both SQLite and Postgres must work.
- Store/compare money or quantities as floats in the DB.
