import { and, eq } from 'drizzle-orm';
import { categories } from '../database/schema';
import { db, fetchOne } from './db';

/**
 * Load a category of the wallet that can receive a new expense/income
 * (of `kind`, when given): same wallet, not archived and not an investment
 * category (those go through the investment forms). Throws 400 otherwise.
 *
 * Auto-imported by Nitro.
 */
export const requireMovementCategory = async (walletId: number, categoryId: number, kind?: 'expense' | 'income') => {
    const category = await fetchOne(db.select().from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.walletId, walletId))));

    if (!category || (kind && category.kind !== kind) || category.isInvestment || category.archivedAt) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid category',
        });
    }
    return category;
};

export const toCents = (euros: number) => Math.round(euros * 100);

/** One-off movements must fall inside the wallet period, where they affect the budget. */
export const assertDateInWallet = (wallet: { startDate: string; endDate: string | null }, date: string) => {
    if (date < wallet.startDate || (wallet.endDate !== null && date > wallet.endDate)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'date: Date is outside the wallet period',
        });
    }
};
