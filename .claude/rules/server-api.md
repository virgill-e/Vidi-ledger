---
paths:
  - "server/**/*.ts"
---
# server/ — Nitro API & DB

- Files: `server/api/<resource>/<name>.<method>.ts`. Method is inferred from the suffix (`.get.ts`, `.post.ts`, `.patch.ts`, `.delete.ts`). Dynamic params: `[id].method.ts`.
- Auth first in every handler: `const user = await requireAuth(event)` (auto-imported from `utils/auth.ts`) — throws 401 if no session and returns the typed `User` (`{ id, email, name, isAdmin }`), so no manual `session.user` cast. Admin-only routes: `await requireAdmin(event)` (throws 401, then 403 if not admin). Log a user in with `createUserSession(event, user)`.
- Wallet-scoped handlers: `const { user, wallet } = await requireWallet(event)` (utils/wallet.ts, 404 if none). Scope every read/write/delete by `wallet.id`, and check that referenced rows (category, pot, asset) belong to that wallet.
- Guard empty PATCH bodies (drizzle throws on `.set({})`).
- Validate request bodies with `validateBody(event, schema)` (auto-imported from `utils/validation.ts`), using a Zod schema defined there — do not hand-roll `if (!field)` checks or call `readBody` directly in handlers. It throws a clean 400 (first issue as `statusMessage`, full list in `data.issues`). Route params from `getRouterParam` are still guarded inline.
- Use `db`, `fetchOne`, `fetchAll` from `~/server/utils/db.ts`. Never `.all()`/`.get()` directly. `db` and the tables are typed `any` (dual dialect), so no casts are needed.
- Insert/update returning a row: `await fetchOne(db.insert(table).values({...}).returning())`.
- Money fields: convert to cents on write (`Math.round(amount * 100)`), expect cents on read. Dates: `'YYYY-MM-DD'` strings. Quantities/prices: scaled integers (`QUANTITY_SCALE`, `UNIT_PRICE_SCALE`).
- Schema edits in `database/schema.ts` only via the dual-dialect helpers; then `db:generate` + `db:push`.
- Sensitive routes apply stricter rate limits via `defineRateLimit` in-handler (global cap is in `middleware/rateLimit.ts`).
