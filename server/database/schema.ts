import { sqliteTable, text as sqliteText, integer as sqliteInteger } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, integer as pgInteger, serial as pgSerial, timestamp as pgTimestamp } from 'drizzle-orm/pg-core';

// Check if we are using Postgres based on the environment
const usePostgres = process.env.DB_TYPE === 'postgres' || process.env.DATABASE_URL?.startsWith('postgres://') || process.env.DATABASE_URL?.startsWith('postgresql://');

// Helper to switch between dialects
const table = (name: string, definition: any) => {
    return usePostgres ? pgTable(name, definition) : sqliteTable(name, definition);
};

const text = (name: string) => usePostgres ? pgText(name) : sqliteText(name);

// Primary key helper
const idColumn = (name: string) => {
    if (usePostgres) {
        return pgSerial(name).primaryKey();
    } else {
        return sqliteInteger(name).primaryKey({ autoIncrement: true });
    }
};

// Date helper
const dateColumn = (name: string) => {
    if (usePostgres) {
        return pgTimestamp(name, { mode: 'date' });
    } else {
        return sqliteInteger(name, { mode: 'timestamp' });
    }
};

// Amount and foreign key helper (integers)
const int = (name: string) => usePostgres ? pgInteger(name) : sqliteInteger(name);

export const users = table('users', {
    id: idColumn('id'),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    password: text('password').notNull(),
    role: text('role').notNull().default('user'),
    createdAt: dateColumn('created_at').notNull().$defaultFn(() => new Date()),
});

export const sessions = table('sessions', {
    id: text('id').primaryKey(),
    userId: int('user_id').notNull().references(() => users.id),
    expiresAt: int('expires_at').notNull(),
});

export const categories = table('categories', {
    id: idColumn('id'),
    userId: int('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    createdAt: dateColumn('created_at').notNull().$defaultFn(() => new Date()),
});

export const expenses = table('expenses', {
    id: idColumn('id'),
    userId: int('user_id').notNull().references(() => users.id),
    categoryId: int('category_id').notNull().references(() => categories.id),
    amount: int('amount').notNull(),
    merchant: text('merchant').notNull(),
    date: dateColumn('date').notNull(),
    note: text('note'),
    createdAt: dateColumn('created_at').notNull().$defaultFn(() => new Date()),
});
