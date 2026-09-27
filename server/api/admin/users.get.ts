import { desc, max } from 'drizzle-orm';
import { sessions, users, wallets } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

// Every account with its wallet and last activity (latest session use).
export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const [rows, walletRows, activity] = await Promise.all([
        fetchAll(db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            isAdmin: users.isAdmin,
            createdAt: users.createdAt,
        }).from(users).orderBy(desc(users.createdAt))),
        fetchAll(db.select({ userId: wallets.userId, name: wallets.name, startDate: wallets.startDate }).from(wallets)),
        fetchAll(db.select({ userId: sessions.userId, lastActiveAt: max(sessions.lastActiveAt) }).from(sessions).groupBy(sessions.userId)),
    ]);

    return rows.map((u: any) => ({
        ...u,
        wallet: walletRows.find((w: any) => w.userId === u.id) ?? null,
        lastActiveAt: activity.find((a: any) => a.userId === u.id)?.lastActiveAt ?? null,
    }));
});
