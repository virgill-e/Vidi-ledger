import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, isPostgres } from './db';

let ready: Promise<void> | null = null;
let failures = 0;

/**
 * Applies pending Drizzle migrations once per process (Postgres only — local
 * SQLite keeps using db:push). Started by server/plugins/migrate.ts at boot and
 * awaited by server/middleware/0.migrations.ts before every request.
 *
 * A failed attempt is retried after 5 s, doubling up to 60 s: the database may
 * just not be reachable yet (restart, boot order), and requests answer 503
 * meanwhile instead of until the next deploy.
 *
 * Migrations run while the previous version may still be serving: keep each
 * one compatible with the code before it (add, don't rename or drop in use).
 */
export const runMigrations = (): Promise<void> => {
    if (!isPostgres) return Promise.resolve();
    if (!ready) {
        const attempt = (async () => {
            const folder = resolve(process.env.MIGRATIONS_DIR ?? 'server/database/migrations');
            if (!existsSync(resolve(folder, 'meta/_journal.json'))) {
                throw new Error(`Migrations folder not found: ${folder} (set MIGRATIONS_DIR)`);
            }
            const started = Date.now();
            await migrate(db, { migrationsFolder: folder });
            console.info(`[migrate] database schema up to date (${Date.now() - started} ms)`);
        })();
        ready = attempt;
        attempt.then(() => { failures = 0; }, (err) => {
            const delay = Math.min(60_000, 5_000 * 2 ** failures++);
            console.error(`[migrate] failed, requests answer 503; retrying in ${delay / 1000} s:`, err);
            setTimeout(() => {
                if (ready === attempt) ready = null;
                runMigrations().catch(() => { /* logged above */ });
            }, delay);
        });
    }
    return ready;
};
