import { eq, max } from 'drizzle-orm';
import { pots } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const body = await validateBody(event, potCreateSchema);

    const last = await fetchOne(db.select({ position: max(pots.position) }).from(pots).where(eq(pots.walletId, wallet.id)));

    const pot = await fetchOne(db.insert(pots).values({
        walletId: wallet.id,
        name: body.name,
        icon: body.icon,
        color: body.color,
        targetAmount: body.targetAmount ? toCents(body.targetAmount) : null,
        position: (last?.position ?? -1) + 1,
    }).returning());

    setResponseStatus(event, 201);
    return { ...pot, balance: 0 };
});
