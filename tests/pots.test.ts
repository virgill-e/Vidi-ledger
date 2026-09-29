import { describe, expect, it } from 'vitest';
import { computeBudget } from '../shared/utils/budget';
import { potBalances, recurringPotCredits } from '../shared/utils/pots';

describe('potBalances', () => {
    it('adds transfers in, subtracts transfers out', () => {
        const b = potBalances([
            { potId: 1, direction: 'to_pot', amount: 10_000 },
            { potId: 1, direction: 'from_pot', amount: 2_500 },
            { potId: 2, direction: 'to_pot', amount: 500 },
        ], []);
        expect(b.get(1)).toBe(7_500);
        expect(b.get(2)).toBe(500);
    });

    it('subtracts expenses/buys paid from a pot and adds incomes credited to it', () => {
        const b = potBalances([{ potId: 1, direction: 'to_pot', amount: 10_000 }], [
            { potId: 1, type: 'expense', amount: 3_000 },
            { potId: 1, type: 'buy', amount: 1_000 },
            { potId: 1, type: 'income', amount: 400 },
            { potId: 1, type: 'dividend', amount: 100 },
            { potId: null, type: 'expense', amount: 99_999 },
        ]);
        expect(b.get(1)).toBe(6_500);
        expect(b.size).toBe(1);
    });
});

describe('recurringPotCredits (monthly contribution to a pot)', () => {
    const wallet = { startDate: '2026-10-01', endDate: null };
    const rule = { potId: 1, amount: 50_000, frequency: 'monthly' as const, startDate: '2026-10-01', endDate: null };

    it('credits each month in full on its first day', () => {
        expect(recurringPotCredits(rule, '2026-09-30', wallet)).toEqual([]);
        expect(recurringPotCredits(rule, '2026-10-01', wallet)).toEqual([{ date: '2026-10-01', amount: 50_000 }]);
        expect(recurringPotCredits(rule, '2026-10-31', wallet)).toHaveLength(1);
        expect(recurringPotCredits(rule, '2026-11-01', wallet)).toEqual([
            { date: '2026-10-01', amount: 50_000 },
            { date: '2026-11-01', amount: 50_000 },
        ]);
    });

    it('credits only the budgeted share of a partial month', () => {
        // Starts on the 15th: 17 of 31 October days → 274,19 €.
        const credits = recurringPotCredits({ ...rule, startDate: '2026-10-15' }, '2026-10-20', wallet);
        expect(credits).toEqual([{ date: '2026-10-15', amount: Math.round((50_000 * 17) / 31) }]);
    });

    it('stops at the rule end and ignores days before the wallet start', () => {
        const ended = recurringPotCredits({ ...rule, startDate: '2026-09-01', endDate: '2026-11-10' }, '2027-01-01', wallet);
        expect(ended).toEqual([
            { date: '2026-10-01', amount: 50_000 },
            { date: '2026-11-01', amount: Math.round((50_000 * 10) / 30) },
        ]);
    });

    it('matches what the budget pays over the same full period', () => {
        const days = computeBudget({ wallet, recurrences: [{ ...rule, kind: 'expense' }], transactions: [], potTransfers: [], until: '2026-10-31' });
        const credited = recurringPotCredits(rule, '2026-10-31', wallet).reduce((s, c) => s + c.amount, 0);
        expect(days.at(-1)!.available).toBe(-credited);
    });

    it('adds the credits to the pot balance', () => {
        const credits = recurringPotCredits(rule, '2026-10-05', wallet).map((c) => ({ potId: 1, amount: c.amount }));
        const b = potBalances([], [{ potId: 1, type: 'buy', amount: 50_000 }], credits);
        expect(b.get(1)).toBe(0);
    });
});
