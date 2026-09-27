import { eq, max } from 'drizzle-orm';
import { categories } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const body = await validateBody(event, categoryCreateSchema);

    // New categories go last in the picker.
    const last = await fetchOne(db.select({ position: max(categories.position) })
        .from(categories)
        .where(eq(categories.walletId, wallet.id)));

    const category = await fetchOne(db.insert(categories).values({
        walletId: wallet.id,
        kind: body.kind,
        name: body.name,
        icon: body.icon,
        color: body.color,
        position: (last?.position ?? -1) + 1,
    }).returning());

    setResponseStatus(event, 201);
    return category;
});
