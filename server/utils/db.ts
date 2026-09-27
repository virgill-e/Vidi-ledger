import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as schema from '../database/schema';

const getDb = () => {
    const dbType = process.env.DB_TYPE;
    const dbUrl = process.env.DATABASE_URL;

    if (dbType === 'postgres' || (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')))) {
        // PostgreSQL for Production (Docker)
        const client = postgres(dbUrl || '');
        return drizzlePg(client, { schema });
    } else {
        // SQLite for Local Development (Default)
        const sqlite = new Database(dbUrl || 'sqlite.db');
        // SQLite ignores foreign keys (and ON DELETE CASCADE) unless enabled per connection.
        sqlite.pragma('foreign_keys = ON');
        return drizzleSqlite(sqlite, { schema });
    }
};

// Typed `any` on purpose: the union of both dialects' drizzle instances has no
// callable query builder, so every call site would otherwise need a cast.
export const db: any = getDb();

// Dialect-agnostic helpers
export const fetchAll = async (query: any) => {
    return query.all ? await query.all() : await query;
};

export const fetchOne = async (query: any) => {
    if (query.get) return await query.get();
    const results = await query;
    return results[0] || null;
};
