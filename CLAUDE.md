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
- typecheck: `npx nuxt typecheck`

## Structure
- `docs/v2/analyse.md`: V2 spec — source of truth for budget rules and the data model.
- `app/`: Nuxt frontend (auto-imported). Subdirs below.
- `app/pages/`: file-based routes. `app/components/` (TheHeader) + `app/components/ui/` (Button, Input).
- `app/layouts/`: `default` (gradient app shell + header), `auth` (centered card, login).
- `app/middleware/`: `auth` (signed-in only), `guest` (signed-out only).
- `app/composables/`: shared state (useState), `useFormat`. `app/assets/css/main.css`: theme tokens.
- `server/api/`: Nitro endpoints, named `<resource>.<method>.ts` (e.g. `index.post.ts`).
- `server/database/schema.ts`: dual-dialect Drizzle schema. `server/utils/db.ts`: `db`, `fetchOne`, `fetchAll`.
- `server/middleware/`: global (rateLimit). `shared/types/`: shared TS types + `auth.d.ts` (User session).

## Rules
- Money stored as integer cents, always positive (the sign comes from the row type). Multiply on write (`Math.round(amount * 100)`), divide on read.
- Business dates are `'YYYY-MM-DD'` text in the wallet's timezone (`localDate`); timestamps only for `created_at`/`updated_at`/`archived_at`.
- Quantities: `bigint` × `QUANTITY_SCALE` (10⁸); unit prices × `UNIT_PRICE_SCALE` (10⁶). Never floats.
- Schema must stay dialect-agnostic: use the helpers in `schema.ts` (`table` — 3rd arg for `index`/`uniqueIndex`/`check` —, `text`, `int`, `bigint`, `bool`, `localDate`, `dateColumn`, `idColumn`), never raw `sqliteTable`/`pgTable`.
- DB queries: use `fetchOne`/`fetchAll` from `server/utils/db.ts`, never call `.all()`/`.get()` directly (Postgres lacks them).
- Every API handler: guard with `const user = await requireAuth(event)` (auto-imported from `server/utils/auth.ts`) → throws 401 if no session, returns `{ id, email, name, isAdmin }`. Admin-only routes: `await requireAdmin(event)` (401/403).
- Data is scoped by wallet (`wallet_id`); one wallet per user (`wallets.user_id` unique). Resolve the user's wallet first, then scope every query by its id.
- Validate request bodies with `validateBody(event, schema)` (auto-imported from `server/utils/validation.ts`); define/reuse a Zod schema there rather than hand-rolling `if (!field)` checks. Route params (`getRouterParam`) are still guarded inline.
- Frontend: `<script setup lang="ts">`, Composition API, typed `defineProps`. Tailwind utility classes only. Icons: `<Icon name="lucide:…" />`.
- Prefer Nuxt auto-imports (no manual import of `ref`, `useState`, `db` helpers where auto-imported).
- After schema changes run `npm run db:generate` (commit migration) then `npm run db:push`.

## Never
- Edit generated dirs: `.nuxt/`, `.output/`, `.nitro/`, `node_modules/`, `server/database/migrations/` (regenerate via drizzle-kit).
- Touch `sqlite.db` or commit it; never commit `.env` or print secret values.
- Point V2 (`db:push`, migrations, the app) at the V1 database — V2 uses a new database; V1 data comes in via the migration script only.
- Hardcode a single DB dialect — both SQLite and Postgres must work.
- Store/compare money or quantities as floats in the DB.
