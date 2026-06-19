# CLAUDE.md

## Stack
Nuxt 4 (Vue 3, Nitro) + TypeScript. Tailwind CSS 4. Drizzle ORM (SQLite local / Postgres prod). Auth: nuxt-auth-utils. Validation: zod. Runtime: Node 22+, npm.

## Commands
- dev: `npm run dev`
- build: `npm run build`
- db push schema: `npm run db:push`
- db gen migration: `npm run db:generate`
- db studio: `npm run db:studio`
- typecheck: `npx nuxt typecheck`

## Structure
- `app/`: Nuxt frontend (auto-imported). Subdirs below.
- `app/pages/`: file-based routes. `app/components/` + `app/components/ui/` (Button, Input).
- `app/composables/`: shared state (useState). `app/middleware/auth.ts`: route guard.
- `app/layouts/`, `app/assets/css/main.css`, `app/utils/` (e.g. exportData).
- `server/api/`: Nitro endpoints, named `<resource>.<method>.ts` (e.g. `index.post.ts`).
- `server/database/schema.ts`: dual-dialect Drizzle schema. `server/utils/db.ts`: `db`, `fetchOne`, `fetchAll`.
- `server/middleware/`: global (rateLimit). `types/`: shared TS types + `auth.d.ts` (User session).

## Rules
- Money stored as integer cents. Multiply on write (`Math.round(amount * 100)`), divide on read.
- Schema must stay dialect-agnostic: use the helpers in `schema.ts` (`text`, `int`, `real`, `dateColumn`, `idColumn`), never raw `sqliteTable`/`pgTable`.
- DB queries: use `fetchOne`/`fetchAll` from `server/utils/db.ts`, never call `.all()`/`.get()` directly (Postgres lacks them).
- Every API handler: guard with `const user = await requireAuth(event)` (auto-imported from `server/utils/auth.ts`) → throws 401 if no session, returns the typed user; scope queries by `user.id`. Admin-only routes: `await requireAdmin(event)` (401/403).
- Validate request bodies with `validateBody(event, schema)` (auto-imported from `server/utils/validation.ts`); define/reuse a Zod schema there rather than hand-rolling `if (!field)` checks. Route params (`getRouterParam`) are still guarded inline.
- Frontend: `<script setup lang="ts">`, Composition API, typed `defineProps`. Tailwind utility classes only.
- Prefer Nuxt auto-imports (no manual import of `ref`, `useState`, `db` helpers where auto-imported).
- After schema changes run `npm run db:generate` (commit migration) then `npm run db:push`.

## Never
- Edit generated dirs: `.nuxt/`, `.output/`, `.nitro/`, `node_modules/`, `server/database/migrations/` (regenerate via drizzle-kit).
- Touch `sqlite.db` or commit it; never commit `.env` or print secret values.
- Hardcode a single DB dialect — both SQLite and Postgres must work.
- Store/compare money as floats in the DB.
