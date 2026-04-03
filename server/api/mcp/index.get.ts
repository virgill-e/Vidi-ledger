import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { eq, desc, and, gte, lte, sum } from 'drizzle-orm';
import { db, fetchAll } from '../../utils/db';
import { mcpTokens, expenses, investments, categories } from '../../database/schema';

export default defineEventHandler(async (event) => {
    const token = getQuery(event).token as string;
    if (!token) throw createError({ statusCode: 401, statusMessage: 'Missing token' });

    const mcpTokenList = await fetchAll(
        db.select()
        .from(mcpTokens as any)
        .where(eq((mcpTokens as any).token, token))
    );

    const tokenData = mcpTokenList[0];
    if (!tokenData || tokenData.revokedAt) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid or revoked token' });
    }

    const userId = tokenData.userId;

    await (db.update(mcpTokens as any)
        .set({ lastUsedAt: new Date() })
        .where(eq((mcpTokens as any).id, tokenData.id)) as any);

    const server = new McpServer({
        name: 'Vidi_MCP',
        version: '1.0.0'
    });

    server.tool('get_expenses',
        'Get user expenses',
        {
            month: z.string().optional().describe('YYYY-MM format'),
            limit: z.number().optional().default(50)
        },
        async ({ month, limit }) => {
            const conditions: any[] = [eq((expenses as any).userId, userId)];
            if (month) {
                const startDate = new Date(`${month}-01T00:00:00Z`);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
                conditions.push(gte((expenses as any).date, startDate));
                conditions.push(lte((expenses as any).date, endDate));
            }
            
            const results = await fetchAll(
                db.select({
                    id: (expenses as any).id,
                    amount: (expenses as any).amount,
                    merchant: (expenses as any).merchant,
                    date: (expenses as any).date,
                    note: (expenses as any).note,
                    category: {
                        name: (categories as any).name,
                        icon: (categories as any).icon
                    }
                })
                .from(expenses as any)
                .leftJoin(categories as any, eq((expenses as any).categoryId, (categories as any).id))
                .where(and(...conditions))
                .orderBy(desc((expenses as any).date))
                .limit(limit)
            );
            
            const mapped = results.map((r: any) => ({
                ...r,
                amount: r.amount / 100
            }));
            
            return { content: [{ type: "text", text: JSON.stringify(mapped, null, 2) }] };
        }
    );

    server.tool('get_investments',
        'Get user investments',
        {
            asset: z.string().optional(),
            type: z.enum(['buy', 'sell']).optional()
        },
        async ({ asset, type }) => {
            const conditions: any[] = [eq((investments as any).userId, userId)];
            if (asset) conditions.push(eq((investments as any).asset, asset));
            if (type) conditions.push(eq((investments as any).type, type));

            const results = await fetchAll(
                db.select()
                .from(investments as any)
                .where(and(...conditions))
                .orderBy(desc((investments as any).date))
            );

            let totalInvested = 0;
            const mapped = results.map((r: any) => {
                const amountEu = r.amount / 100;
                totalInvested += (r.type === 'buy' ? amountEu : -amountEu);
                return { ...r, amount: amountEu };
            });

            return { content: [{ type: "text", text: JSON.stringify({ investments: mapped, total_invested_net: totalInvested }, null, 2) }] };
        }
    );

    server.tool('get_summary',
        'Get all-time and current month financial summary',
        {},
        async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const allExpenses = await fetchAll(
                db.select().from(expenses as any).where(eq((expenses as any).userId, userId))
            );
            
            const allInvestments = await fetchAll(
                db.select().from(investments as any).where(eq((investments as any).userId, userId))
            );

            let totalExpensesAllTime = 0;
            let totalExpensesCurrentMonth = 0;
            for (const item of allExpenses) {
                totalExpensesAllTime += item.amount;
                if (new Date(item.date) >= startOfMonth) {
                    totalExpensesCurrentMonth += item.amount;
                }
            }

            let totalInvested = 0;
            let totalSold = 0;
            for (const item of allInvestments) {
                if (item.type === 'buy') totalInvested += item.amount;
                if (item.type === 'sell') totalSold += item.amount;
            }

            const netInvested = totalInvested - totalSold;

            const summary = {
                total_expenses_month_current: totalExpensesCurrentMonth / 100,
                total_expenses_all_time: totalExpensesAllTime / 100,
                total_invested: totalInvested / 100,
                total_sold: totalSold / 100,
                net_invested: netInvested / 100,
                nb_expenses: allExpenses.length,
                nb_investments: allInvestments.length
            };

            return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
        }
    );

    server.tool('get_categories',
        'Get spending categories and totals',
        {},
        async () => {
            const results = await fetchAll(
                db.select({
                    id: (categories as any).id,
                    name: (categories as any).name,
                    icon: (categories as any).icon,
                    totalSpent: sum((expenses as any).amount)
                })
                .from(categories as any)
                .leftJoin(expenses as any, eq((categories as any).id, (expenses as any).categoryId))
                .where(eq((categories as any).userId, userId))
                .groupBy((categories as any).id)
            );

            const mapped = results.map((r: any) => ({
                ...r,
                totalSpent: (Number(r.totalSpent) || 0) / 100
            }));

            return { content: [{ type: "text", text: JSON.stringify(mapped, null, 2) }] };
        }
    );

    server.tool('get_expenses_by_period',
        'Get expenses grouped by category for a period',
        {
            from: z.string().describe('YYYY-MM-DD'),
            to: z.string().describe('YYYY-MM-DD')
        },
        async ({ from, to }) => {
            const startDate = new Date(from);
            startDate.setUTCHours(0, 0, 0, 0);
            
            const endDate = new Date(to);
            endDate.setUTCHours(23, 59, 59, 999);

            const results = await fetchAll(
                db.select({
                    categoryId: (categories as any).id,
                    name: (categories as any).name,
                    icon: (categories as any).icon,
                    total: sum((expenses as any).amount)
                })
                .from(expenses as any)
                .leftJoin(categories as any, eq((expenses as any).categoryId, (categories as any).id))
                .where(and(
                    eq((expenses as any).userId, userId),
                    gte((expenses as any).date, startDate),
                    lte((expenses as any).date, endDate)
                ))
                .groupBy((categories as any).id)
            );

            const mapped = results.map((r: any) => ({
                ...r,
                total: (Number(r.total) || 0) / 100
            }));

            return { content: [{ type: "text", text: JSON.stringify(mapped, null, 2) }] };
        }
    );

    const transport = new SSEServerTransport('/api/mcp/message', event.node.res);
    await server.connect(transport);

    const sessionId = transport.sessionId;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).mcpTransports = (globalThis as any).mcpTransports || new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).mcpTransports.set(sessionId, transport);
    
    event.node.req.on('close', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).mcpTransports?.delete(sessionId);
    });
});
