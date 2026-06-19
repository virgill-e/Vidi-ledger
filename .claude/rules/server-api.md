---
paths:
  - "server/**/*.ts"
---
# server/ — Nitro API & DB

- Files: `server/api/<resource>/<name>.<method>.ts`. Method is inferred from the suffix (`.get.ts`, `.post.ts`, `.patch.ts`, `.delete.ts`). Dynamic params: `[id].method.ts`.
- Auth first in every handler: `const session = await getUserSession(event)`; if `!session.user` → `throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })`. Cast user: `session.user as { id: number }`.
- Always scope reads/writes/deletes by `userId` to prevent cross-user access.
- Validate request bodies with `validateBody(event, schema)` (auto-imported from `utils/validation.ts`), using a Zod schema defined there — do not hand-roll `if (!field)` checks or call `readBody` directly in handlers. It throws a clean 400 (first issue as `statusMessage`, full list in `data.issues`). Route params from `getRouterParam` are still guarded inline.
- Use `db`, `fetchOne`, `fetchAll` from `~/server/utils/db.ts`. Never `.all()`/`.get()` directly.
- Insert/update returning a row: `await fetchOne(db.insert(table as any).values({...} as any).returning())`.
- Money fields: convert to cents on write (`Math.round(amount * 100)`), expect cents on read.
- Schema edits in `database/schema.ts` only via the dual-dialect helpers; then `db:generate` + `db:push`.
- Sensitive routes apply stricter rate limits via `defineRateLimit` in-handler (global cap is in `middleware/rateLimit.ts`).
