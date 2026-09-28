import { describe, expect, it } from 'vitest';
import {
    compareWithV1, convertTrade, groupByAsset, v1Aggregate, type ConvertedTrade, type V1Investment,
} from '../scripts/migrate-from-v1/convert';
import type { Trade } from '../shared/utils/portfolio';

let id = 1;
const row = (type: string, asset: string, date: string, amount: number, quantity: number): V1Investment =>
    ({ id: id++, userId: 1, type, asset, amount, quantity, date, note: null });
const asTrades = (rows: V1Investment[]): Trade[] =>
    rows.map((r) => ({ ...(convertTrade(r) as { trade: ConvertedTrade }).trade, id: r.id }));

describe('V1 → V2 conversion', () => {
    it('groups assets case-insensitively and keeps the most frequent spelling', () => {
        const groups = groupByAsset([row('buy', 'VWCE', '2026-01-01', 100, 1), row('buy', 'vwce ', '2026-01-02', 100, 1), row('buy', 'VWCE', '2026-01-03', 100, 1)]);
        expect([...groups.keys()]).toEqual(['vwce']);
        expect(groups.get('vwce')!.name).toBe('VWCE');
        expect(groups.get('vwce')!.rows).toHaveLength(3);
    });

    it('scales quantities exactly and drops the V1 zero quantity of dividends', () => {
        expect(convertTrade(row('buy', 'BTC', '2026-01-01', 5_000, 0.00123456))).toMatchObject({ trade: { quantity: 123_456 } });
        expect(convertTrade(row('dividend', 'VWCE', '2026-01-01', 150, 0))).toMatchObject({ trade: { quantity: null } });
    });

    it('reports rows that V2 constraints would reject', () => {
        expect(convertTrade(row('buy', 'X', '2026-01-01', 0, 1))).toHaveProperty('error');
        expect(convertTrade(row('sell', 'X', '2026-01-01', 100, 0))).toHaveProperty('error');
        expect(convertTrade(row('transfer', 'X', '2026-01-01', 100, 1))).toHaveProperty('error');
    });

    it('matches V1 figures, including a same-day buy + sell and a partial sale', () => {
        const rows = [
            row('buy', 'VWCE', '2026-01-10', 20_100, 2),
            row('buy', 'VWCE', '2026-02-10', 11_000, 1),
            row('sell', 'VWCE', '2026-02-10', 12_000, 1),
            row('dividend', 'VWCE', '2026-03-01', 300, 0),
            row('sell', 'VWCE', '2026-03-10', 5_000, 0.5),
        ];
        expect(compareWithV1(v1Aggregate(rows), asTrades(rows))).toEqual([]);
    });

    it('flags a difference', () => {
        const rows = [row('buy', 'VWCE', '2026-01-10', 20_100, 2)];
        const trades = asTrades(rows);
        trades[0]!.amount = 20_000;
        expect(compareWithV1(v1Aggregate(rows), trades)).toEqual(['cost basis 20100 → 20000 cents']);
    });
});
