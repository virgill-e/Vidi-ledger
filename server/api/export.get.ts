import { eq } from 'drizzle-orm';
import { strToU8, zipSync } from 'fflate';
import { z } from 'zod';
import { assets, categories, potTransfers, pots, recurrences, transactions } from '../database/schema';
import { db, fetchAll } from '../utils/db';

const querySchema = z.object({
    from: z.string().refine(isLocalDate).optional(),
    to: z.string().refine(isLocalDate).optional(),
}).refine((q) => !q.from || !q.to || q.from <= q.to);

// Zip of the wallet's data (CSV + JSON + LISEZMOI.md), see server/utils/export.ts.
export default defineEventHandler(async (event) => {
    await defineRateLimit({ max: 10, window: 60 })(event);
    const { wallet } = await requireWallet(event);
    const query = querySchema.safeParse(getQuery(event));
    if (!query.success) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid query' });
    }
    const { from, to } = query.data;

    const scoped = (table: any) => fetchAll(db.select().from(table).where(eq(table.walletId, wallet.id)));
    const [categoryRows, potRows, assetRows, transactionRows, recurrenceRows, transferRows] = await Promise.all(
        [categories, pots, assets, transactions, recurrences, potTransfers].map(scoped),
    );

    const exportedOn = todayIn(wallet.timezone);
    const files = buildExport({
        wallet: { name: wallet.name, startDate: wallet.startDate, endDate: wallet.endDate, currency: wallet.currency, timezone: wallet.timezone },
        categories: categoryRows,
        pots: potRows,
        assets: assetRows,
        transactions: transactionRows,
        recurrences: recurrenceRows,
        potTransfers: transferRows,
    }, { from, to, exportedOn });

    const zip = zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));
    const suffix = from || to ? `_${from ?? 'debut'}_${to ?? exportedOn}` : '';
    setResponseHeaders(event, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="vidi-export-${exportedOn}${suffix}.zip"`,
        'Cache-Control': 'no-store',
    });
    return zip;
});
