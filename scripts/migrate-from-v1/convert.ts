// Pure V1 → V2 conversion helpers (spec: docs/v2/analyse.md §4). No I/O.

import { isLocalDate } from '../../shared/utils/dates';
import { QUANTITY_SCALE, computePosition, type Trade } from '../../shared/utils/portfolio';

export interface V1User {
    id: number;
    email: string;
    name: string;
    password: string; // bcrypt hash, copied as is
    role: string;
    createdAt: number; // epoch ms
}

export interface V1Investment {
    id: number;
    userId: number;
    type: string;
    asset: string;
    amount: number; // cents
    quantity: number; // float
    date: string; // 'YYYY-MM-DD', formatted by the source query
    note: string | null;
}

export interface ConvertedTrade {
    v1Id: number;
    type: 'buy' | 'sell' | 'dividend';
    date: string;
    amount: number;
    quantity: number | null; // scaled
    memo: string | null;
}

export const assetKey = (name: string) => name.trim().toLowerCase();

/**
 * A user's V1 rows grouped by case-insensitive asset name (V2 has one asset
 * per name). The display name is the most frequent spelling, the first seen
 * on a tie.
 */
export const groupByAsset = (rows: V1Investment[]) => {
    const groups = new Map<string, { name: string; rows: V1Investment[] }>();
    for (const row of rows) {
        const key = assetKey(row.asset);
        const group = groups.get(key) ?? { name: row.asset.trim(), rows: [] };
        group.rows.push(row);
        groups.set(key, group);
    }
    for (const group of groups.values()) {
        const counts = new Map<string, number>();
        for (const r of group.rows) counts.set(r.asset.trim(), (counts.get(r.asset.trim()) ?? 0) + 1);
        group.name = [...counts.entries()].reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
    }
    return groups;
};

export const toScaledQuantity = (quantity: number) => Math.round(quantity * QUANTITY_SCALE);

/** V1 row → V2 trade, or the reason it cannot be migrated as is (V2 CHECK constraints). */
export const convertTrade = (row: V1Investment): { trade: ConvertedTrade } | { error: string } => {
    const where = `investment #${row.id} (${row.asset}, ${row.date})`;
    if (row.type !== 'buy' && row.type !== 'sell' && row.type !== 'dividend') return { error: `${where}: unknown type "${row.type}"` };
    if (!Number.isInteger(row.amount) || row.amount <= 0) return { error: `${where}: amount must be a positive number of cents (got ${row.amount})` };
    if (!isLocalDate(row.date)) return { error: `${where}: invalid date` };
    const quantity = toScaledQuantity(row.quantity ?? 0);
    if (row.type !== 'dividend' && quantity <= 0) return { error: `${where}: ${row.type} needs a positive quantity (got ${row.quantity})` };
    return {
        trade: {
            v1Id: row.id,
            type: row.type,
            date: row.date,
            amount: row.amount,
            quantity: row.type === 'dividend' ? (quantity > 0 ? quantity : null) : quantity,
            memo: row.note?.trim() || null,
        },
    };
};

/**
 * V1's own aggregation (V1/main server/api/investments/assets.get.ts):
 * chronological by date then id, weighted average cost, float quantities.
 * Used as the reference the migrated data must match.
 */
export const v1Aggregate = (rows: V1Investment[]) => {
    const sorted = [...rows].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
    let cost = 0;
    let quantity = 0;
    let dividends = 0;
    for (const tx of sorted) {
        if (tx.type === 'buy') {
            cost += tx.amount;
            quantity += tx.quantity;
        } else if (tx.type === 'sell') {
            const avg = quantity > 0 ? cost / quantity : 0;
            cost -= avg * Math.min(tx.quantity, quantity);
            quantity -= tx.quantity;
        } else if (tx.type === 'dividend') {
            dividends += tx.amount;
        }
    }
    return { count: rows.length, quantity, cost: quantity > 0 ? cost : 0, dividends };
};

/** Differences between V1's figures and the V2 position of the same asset; empty = identical. */
export const compareWithV1 = (v1: ReturnType<typeof v1Aggregate>, trades: Trade[]): string[] => {
    const v2 = computePosition(trades);
    const issues: string[] = [];
    if (v1.count !== trades.length) issues.push(`operations ${v1.count} → ${trades.length}`);
    if (Math.abs(toScaledQuantity(Math.max(0, v1.quantity)) - v2.quantity) > 1) issues.push(`quantity ${v1.quantity} → ${v2.quantity / QUANTITY_SCALE}`);
    if (Math.abs(Math.round(v1.cost) - v2.costBasis) > 1) issues.push(`cost basis ${Math.round(v1.cost)} → ${v2.costBasis} cents`);
    if (v1.dividends !== v2.dividends) issues.push(`dividends ${v1.dividends} → ${v2.dividends} cents`);
    return issues;
};
