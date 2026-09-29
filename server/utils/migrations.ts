import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, isPostgres } from './db';

let ready: Promise<void> | null = null;

/**
 * Applies pending Drizzle migrations once per process (Postgres only — local
 * SQLite keeps using db:push). Started by server/plugins/migrate.ts at boot and
 * awaited by server/middleware/0.migrations.ts before every request.
 *
 * Migrations run while the previous version may still be serving: keep each
 * one compatible with the code before it (add, don't rename or drop in use).
 */
export const runMigrations = (): Promise<void> => {
    if (!isPostgres) return Promise.resolve();
    if (!ready) {
        ready = (async () => {
            const folder = resolve(process.env.MIGRATIONS_DIR ?? 'server/database/migrations');
            if (!existsSync(resolve(folder, 'meta/_journal.json'))) {
                throw new Error(`Migrations folder not found: ${folder} (set MIGRATIONS_DIR)`);
            }
            const started = Date.now();
            await migrate(db, { migrationsFolder: folder });
            console.info(`[migrate] database schema up to date (${Date.now() - started} ms)`);
        })();
        ready.catch((err) => console.error('[migrate] failed, requests answer 503 until fixed:', err));
    }
    return ready;
};
