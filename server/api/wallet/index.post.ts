import { wallets } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const body = await validateBody(event, walletCreateSchema);

    // One wallet per user (wallets.user_id is unique).
    if (await findUserWallet(user.id)) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Wallet already exists',
        });
    }

    const wallet = await fetchOne(db.insert(wallets).values({
        userId: user.id,
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        currency: body.currency,
        timezone: body.timezone,
    }).returning());

    await seedDefaultCategories(wallet.id);

    setResponseStatus(event, 201);
    return wallet;
});
