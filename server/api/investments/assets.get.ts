import { eq } from 'drizzle-orm';
import { investments } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const userId = (session.user as { id: number }).id;

    try {
        // Query all investments of the user
        const allInvestments = await fetchAll(
            db.select()
              .from(investments as any)
              .where(eq((investments as any).userId, userId))
        );

        // Group by asset name
        const assetGroups: Record<string, typeof allInvestments> = {};
        for (const tx of allInvestments) {
            const assetName = tx.asset;
            if (!assetGroups[assetName]) {
                assetGroups[assetName] = [];
            }
            assetGroups[assetName].push(tx);
        }

        // Calculate metrics for each asset
        const results = Object.entries(assetGroups).map(([assetName, txs]) => {
            let totalCost = 0;
            let totalQty = 0;
            let totalDividends = 0;

            for (const tx of txs) {
                if (tx.type === 'buy') {
                    totalCost += tx.amount;
                    totalQty += tx.quantity;
                } else if (tx.type === 'sell') {
                    totalQty -= tx.quantity;
                } else if (tx.type === 'dividend') {
                    totalDividends += tx.amount;
                }
            }

            const pru = totalQty > 0 ? (totalCost / totalQty) : 0;
            
            // As per instruction: "unrealizedPnL : (currentPrice × totalQty) - totalCost [si prix actuel disponible, sinon 0]"
            // Since currentPrice is not available in the database, we default to 0
            const currentPrice: number | null = null;
            const unrealizedPnL = currentPrice !== null ? (currentPrice * totalQty) - totalCost : 0;

            const totalReturn = unrealizedPnL + totalDividends;

            return {
                name: assetName,
                totalCost,
                totalQty,
                totalQuantity: totalQty, // backward-compatibility field for UI autocomplete
                pru,
                totalDividends,
                unrealizedPnL,
                totalReturn
            };
        });

        // Sort the results by activity (transaction count) descending
        results.sort((a, b) => {
            const countA = assetGroups[a.name]?.length || 0;
            const countB = assetGroups[b.name]?.length || 0;
            return countB - countA;
        });

        return results.slice(0, 50);

    } catch (error) {
        console.error('Assets API Error:', error);
        return [];
    }
});
