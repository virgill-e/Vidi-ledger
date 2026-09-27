import { describe, expect, it } from 'vitest';
import { potBalances } from '../shared/utils/pots';

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
