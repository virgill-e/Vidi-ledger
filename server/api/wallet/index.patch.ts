import { eq } from 'drizzle-orm';
import { wallets } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const changes = await validateBody(event, walletUpdateSchema);

    const startDate = changes.startDate ?? wallet.startDate;
    const endDate = changes.endDate !== undefined ? changes.endDate : wallet.endDate;
    if (endDate !== null && endDate < startDate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'endDate: End date must be on or after the start date',
        });
    }

    if (Object.keys(changes).length === 0) return wallet;

    return fetchOne(db.update(wallets)
        .set(changes)
        .where(eq(wallets.id, wallet.id))
        .returning());
});
