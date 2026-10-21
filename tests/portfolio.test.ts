import { describe, expect, it } from 'vitest';
import {
    QUANTITY_SCALE, averageCostHistory, computePosition, firstOversell, formatScaled, parseScaled, tradeUnitPrice, type Trade,
} from '../shared/utils/portfolio';

let nextId = 1;
const t = (type: Trade['type'], date: string, amount: number, units: number | null): Trade =>
    ({ id: nextId++, type, date, amount, quantity: units === null ? null : Math.round(units * QUANTITY_SCALE) });

describe('decimal parsing', () => {
    it('parses quantities exactly, comma or dot', () => {
        expect(parseScaled('1,5', 8)).toBe(150_000_000);
        expect(parseScaled('0.00000001', 8)).toBe(1);
        expect(parseScaled('12', 8)).toBe(1_200_000_000);
        expect(parseScaled('0.1', 8)! + parseScaled('0.2', 8)!).toBe(parseScaled('0.3', 8));
    });

    it('rejects invalid, zero or over-precise input', () => {
        expect(parseScaled('abc', 8)).toBeNull();
        expect(parseScaled('0', 8)).toBeNull();
        expect(parseScaled('-1', 8)).toBeNull();
        expect(parseScaled('0.123456789', 8)).toBeNull();
    });

    it('formats back without trailing zeros', () => {
        expect(formatScaled(150_000_000, 8)).toBe('1,5');
        expect(formatScaled(1, 8)).toBe('0,00000001');
        expect(formatScaled(123_400_000_000, 8)).toBe('1 234');
    });
});

describe('computePosition (weighted average cost, like V1)', () => {
    it('averages the cost of successive buys', () => {
        const p = computePosition([t('buy', '2026-01-10', 10_000, 1), t('buy', '2026-02-10', 30_000, 2)]);
        expect(p.quantity).toBe(3 * QUANTITY_SCALE);
        expect(p.costBasis).toBe(40_000);
        expect(Math.round(p.averageCost!)).toBe(13_333);
        expect(p.invested).toBe(40_000);
    });

    it('sells at the average cost and books the realized gain', () => {
        const p = computePosition([
            t('buy', '2026-01-10', 10_000, 1),
            t('buy', '2026-02-10', 30_000, 2),
            t('sell', '2026-03-10', 20_000, 1), // average 133,33 → +66,67
        ]);
        expect(p.quantity).toBe(2 * QUANTITY_SCALE);
        expect(p.costBasis).toBe(26_667);
        expect(p.realizedPnL).toBe(6_667);
    });

    it('keeps dividends apart and closes the position when everything is sold', () => {
        const p = computePosition([t('buy', '2026-01-10', 10_000, 2), t('dividend', '2026-02-01', 150, null), t('sell', '2026-03-01', 12_000, 2)]);
        expect(p).toMatchObject({ quantity: 0, costBasis: 0, averageCost: null, realizedPnL: 2_000, dividends: 150 });
    });

    it('orders same-day trades by insertion so a buy+sell pair works', () => {
        const buy = t('buy', '2026-01-10', 10_000, 1);
        const sell = t('sell', '2026-01-10', 11_000, 1);
        expect(computePosition([sell, buy]).realizedPnL).toBe(1_000);
    });

    it('works with fractional crypto quantities', () => {
        const p = computePosition([t('buy', '2026-01-10', 5_000, 0.00123456)]);
        expect(p.quantity).toBe(123_456);
        expect(Math.round(p.averageCost!)).toBe(4_050_026); // 50 € / 0,00123456 = 40 500,26 €
    });
});

describe('guards and chart helpers', () => {
    it('detects a sale exceeding the holding at its date', () => {
        expect(firstOversell([t('buy', '2026-01-10', 1, 1), t('sell', '2026-01-11', 1, 1)])).toBe(-1);
        expect(firstOversell([t('sell', '2026-01-09', 1, 1), t('buy', '2026-01-10', 1, 1)])).toBe(0);
    });

    it('computes unit prices per trade and the PRU history', () => {
        expect(tradeUnitPrice(t('buy', '2026-01-10', 30_000, 2))).toBe(15_000);
        expect(tradeUnitPrice(t('dividend', '2026-01-10', 100, null))).toBeNull();
        const history = averageCostHistory([t('buy', '2026-01-10', 10_000, 1), t('buy', '2026-02-10', 20_000, 1), t('sell', '2026-03-10', 1, 2)]);
        expect(history.map((h) => h.averageCost)).toEqual([10_000, 15_000, null]);
    });
});

describe('rewards (staking, airdrops: units received for free)', () => {
    // 10 SOL bought for 1 000 €, then 0,5 SOL of staking rewards.
    const bought = () => t('buy', '2026-01-10', 100_000, 10);
    const staked = () => t('reward', '2026-02-01', 0, 0.5);

    it('adds units at no cost: same cost basis and invested amount, lower PRU', () => {
        const p = computePosition([bought(), staked()]);
        expect(p.quantity).toBe(10.5 * QUANTITY_SCALE);
        expect(p.costBasis).toBe(100_000);
        expect(p.invested).toBe(100_000);
        expect(p.rewards).toBe(0.5 * QUANTITY_SCALE);
        expect(Math.round(p.averageCost!)).toBe(Math.round(100_000 / 10.5)); // 95,24 € instead of 100 €
    });

    it('lets the rewarded units be sold, at the lowered average cost', () => {
        const trades = [bought(), staked(), t('sell', '2026-03-01', 115_500, 10.5)];
        expect(firstOversell(trades)).toBe(-1);
        expect(computePosition(trades)).toMatchObject({ quantity: 0, costBasis: 0, realizedPnL: 15_500 });
    });

    it('only counts once received: a sale dated before the reward cannot use its units', () => {
        expect(firstOversell([bought(), t('sell', '2026-01-20', 105_000, 10.5), staked()])).toBe(1);
    });

    it('has no unit price and moves the PRU line of the chart', () => {
        expect(tradeUnitPrice(staked())).toBeNull();
        const history = averageCostHistory([bought(), staked()]);
        expect(history).toHaveLength(2);
        expect(history[1]!.averageCost!).toBeLessThan(history[0]!.averageCost!);
    });
});

describe('fees paid in units (unstaking): units taken without cash', () => {
    // 10 SOL bought for 1 000 €, then 0,02 SOL paid as an unstaking fee.
    const bought = () => t('buy', '2026-01-10', 100_000, 10);
    const fee = () => t('fee', '2026-02-01', 0, 0.02);

    it('keeps the cost with the units left: same cost basis, higher PRU', () => {
        const p = computePosition([bought(), fee()]);
        expect(p.quantity).toBe(9.98 * QUANTITY_SCALE);
        expect(p.costBasis).toBe(100_000);
        expect(p.realizedPnL).toBe(0);
        expect(p.fees).toBe(0.02 * QUANTITY_SCALE);
        expect(Math.round(p.averageCost!)).toBe(Math.round(100_000 / 9.98)); // 100,20 € instead of 100 €
    });

    it('cannot take more than what is held, and the fee counts in the end result', () => {
        expect(firstOversell([bought(), t('fee', '2026-02-01', 0, 10.5)])).toBe(1);
        const sold = computePosition([bought(), fee(), t('sell', '2026-03-01', 110_000, 9.98)]);
        expect(sold).toMatchObject({ quantity: 0, costBasis: 0, realizedPnL: 10_000 });
    });

    it('turns the remaining cost into a loss when a fee takes the last units', () => {
        expect(computePosition([bought(), t('fee', '2026-02-01', 0, 10)])).toMatchObject({ quantity: 0, costBasis: 0, realizedPnL: -100_000 });
    });

    it('has no unit price and raises the PRU line of the chart', () => {
        expect(tradeUnitPrice(fee())).toBeNull();
        const history = averageCostHistory([bought(), fee()]);
        expect(history[1]!.averageCost!).toBeGreaterThan(history[0]!.averageCost!);
    });
});
