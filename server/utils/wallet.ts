import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import { categories, wallets } from '../database/schema';
import { db, fetchOne } from './db';

export const findUserWallet = async (userId: number) =>
    fetchOne(db.select().from(wallets).where(eq(wallets.userId, userId)));

/**
 * Require an authenticated user who has created their wallet.
 * Throws 401 without a session, 404 if the user has no wallet yet.
 * Every wallet-scoped handler starts here, then filters by `wallet.id`.
 *
 * Auto-imported by Nitro (like `requireAuth`).
 */
export const requireWallet = async (event: H3Event) => {
    const user = await requireAuth(event);
    const wallet = await findUserWallet(user.id);
    if (!wallet) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Wallet not found',
        });
    }
    return { user, wallet };
};

// Seeded when a wallet is created (spec §2.5). The two investment categories
// unlock the asset/quantity fields: buys under "Investissement", sells and
// dividends under "Revenus d'investissement".
const DEFAULT_CATEGORIES = [
    { kind: 'expense', name: 'Logement', icon: 'lucide:house', color: '#5b6cf0' },
    { kind: 'expense', name: 'Charges', icon: 'lucide:receipt', color: '#8b5cf6' },
    { kind: 'expense', name: 'Transports', icon: 'lucide:car', color: '#0ea5e9' },
    { kind: 'expense', name: 'Courses', icon: 'lucide:shopping-cart', color: '#f59e0b' },
    { kind: 'expense', name: 'Sorties & restaurants', icon: 'lucide:utensils', color: '#ef4444' },
    { kind: 'expense', name: 'Santé', icon: 'lucide:heart-pulse', color: '#ec4899' },
    { kind: 'expense', name: 'Loisirs', icon: 'lucide:party-popper', color: '#14b8a6' },
    { kind: 'expense', name: 'Autre', icon: 'lucide:ellipsis', color: '#64748b' },
    { kind: 'expense', name: 'Investissement', icon: 'lucide:chart-line', color: '#2563eb', isInvestment: true },
    { kind: 'income', name: 'Salaire', icon: 'lucide:banknote', color: '#22a55b' },
    { kind: 'income', name: "Revenus d'investissement", icon: 'lucide:trending-up', color: '#0d9488', isInvestment: true },
] as const;

export const seedDefaultCategories = async (walletId: number) => {
    await db.insert(categories).values(DEFAULT_CATEGORIES.map((c, i) => ({
        walletId,
        kind: c.kind,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isInvestment: 'isInvestment' in c ? c.isInvestment : false,
        position: i,
    }))).execute();
};
