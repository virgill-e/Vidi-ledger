import { describe, expect, it } from 'vitest';
import { computeBudget, dailyAmount, type BudgetRecurrence, type BudgetTransaction } from '../shared/utils/budget';
import { addDays, isLocalDate, todayIn } from '../shared/utils/dates';

const salary = (amount: number, startDate = '2026-01-01', endDate: string | null = null): BudgetRecurrence =>
    ({ kind: 'income', amount, frequency: 'monthly', startDate, endDate });
const charge = (amount: number, frequency: BudgetRecurrence['frequency'] = 'monthly', startDate = '2026-01-01'): BudgetRecurrence =>
    ({ kind: 'expense', amount, frequency, startDate, endDate: null });
const expense = (date: string, amount: number, extra: Partial<BudgetTransaction> = {}): BudgetTransaction =>
    ({ type: 'expense', date, amount, potId: null, spreadDays: 1, ...extra });

const run = (opts: {
    start: string;
    end?: string | null;
    until: string;
    recurrences?: BudgetRecurrence[];
    transactions?: BudgetTransaction[];
    potTransfers?: { direction: 'to_pot' | 'from_pot'; amount: number; date: string }[];
}) => computeBudget({
    wallet: { startDate: opts.start, endDate: opts.end ?? null },
    recurrences: opts.recurrences ?? [],
    transactions: opts.transactions ?? [],
    potTransfers: opts.potTransfers ?? [],
    until: opts.until,
});

const byDate = (days: ReturnType<typeof run>) => Object.fromEntries(days.map((d) => [d.date, d]));

describe('smoothing', () => {
    it('splits a monthly amount over the days of the month (2 335 € in September = 77,83 €/day)', () => {
        expect(Math.round(dailyAmount(233_500, 'monthly', '2026-09-10'))).toBe(7_783);
    });

    it('a full month adds up to the monthly amount exactly', () => {
        const days = run({ start: '2026-09-01', until: '2026-09-30', recurrences: [salary(233_500)] });
        expect(days).toHaveLength(30);
        expect(days.at(-1)!.available).toBe(233_500);
    });

    it('uses 28 / 29 days in February', () => {
        expect(run({ start: '2027-02-01', until: '2027-02-28', recurrences: [salary(280_000)] }).at(-1)!.available).toBe(280_000);
        expect(run({ start: '2028-02-01', until: '2028-02-29', recurrences: [salary(290_000)] }).at(-1)!.available).toBe(290_000);
    });

    it('splits weekly amounts over 7 days and yearly ones over 365 / 366 days', () => {
        expect(run({ start: '2026-09-01', until: '2026-09-07', recurrences: [{ ...salary(7_000), frequency: 'weekly' }] }).at(-1)!.available).toBe(7_000);
        expect(run({ start: '2026-01-01', until: '2026-12-31', recurrences: [{ ...salary(365_00), frequency: 'yearly' }] }).at(-1)!.available).toBe(365_00);
        expect(run({ start: '2028-01-01', until: '2028-12-31', recurrences: [{ ...salary(366_00), frequency: 'yearly' }] }).at(-1)!.available).toBe(366_00);
    });

    it('only counts a recurrence inside its application period', () => {
        const days = byDate(run({
            start: '2026-09-01',
            until: '2026-09-30',
            recurrences: [{ ...salary(30_000), startDate: '2026-09-11', endDate: '2026-09-20' }],
        }));
        expect(days['2026-09-10']!.available).toBe(0);
        expect(days['2026-09-11']!.allowance).toBe(1_000);
        expect(days['2026-09-20']!.available).toBe(10_000);
        expect(days['2026-09-21']!.allowance).toBe(0);
    });
});

describe("reference app (Today's Budget screenshots)", () => {
    // 2 335 € salary, 1 121 € of monthly charges → 40,47 €/day; 10 € of groceries today.
    const days = byDate(run({
        start: '2026-09-26',
        until: '2026-09-28',
        recurrences: [salary(233_500), charge(112_100)],
        transactions: [expense('2026-09-26', 1_000)],
    }));

    it('today: 40,47 − 10,00 = 30,47', () => {
        expect(days['2026-09-26']!.allowance).toBe(4_047);
        expect(days['2026-09-26']!.available).toBe(3_047);
    });

    it('Sunday tooltip: surplus 30,47 + daily budget 40,47 → 70,93', () => {
        expect(days['2026-09-27']).toMatchObject({ carry: 3_047, allowance: 4_047, available: 7_093 });
    });

    it('Monday: 111,40', () => {
        expect(days['2026-09-28']!.available).toBe(11_140);
    });
});

describe('carry-over', () => {
    it('carries a deficit to the following days', () => {
        const days = run({ start: '2026-09-01', until: '2026-09-03', recurrences: [{ ...salary(1_000), frequency: 'daily' }], transactions: [expense('2026-09-01', 2_500)] });
        expect(days.map((d) => d.available)).toEqual([-1_500, -500, 500]);
    });

    it('a wallet starting mid-month only gets the remaining days, at the monthly average', () => {
        const days = run({ start: '2026-09-15', until: '2026-09-30', recurrences: [salary(233_500)] });
        expect(days).toHaveLength(16);
        expect(days.at(-1)!.available).toBe(Math.round((233_500 * 16) / 30));
    });

    it('ignores movements dated before the wallet start (e.g. migrated V1 history)', () => {
        const days = run({ start: '2026-09-15', until: '2026-09-15', transactions: [expense('2026-09-14', 5_000), { ...expense('2026-09-01', 9_000), type: 'buy' }] });
        expect(days[0]!.available).toBe(0);
    });

    it('stops at the wallet end date', () => {
        expect(run({ start: '2026-09-01', end: '2026-09-10', until: '2026-12-31' })).toHaveLength(10);
        expect(run({ start: '2026-10-01', until: '2026-09-30' })).toEqual([]);
    });
});

describe('one-off movements', () => {
    it('spreads an expense over N days', () => {
        const days = run({ start: '2026-09-01', until: '2026-09-04', transactions: [expense('2026-09-01', 9_000, { spreadDays: 3 })] });
        expect(days.map((d) => d.spent)).toEqual([3_000, 3_000, 3_000, 0]);
        expect(days.at(-1)!.available).toBe(-9_000);
    });

    it('counts buys as expenses, sells and dividends as income', () => {
        const days = run({
            start: '2026-09-01',
            until: '2026-09-01',
            transactions: [
                { ...expense('2026-09-01', 10_000), type: 'buy' },
                { ...expense('2026-09-01', 4_000), type: 'sell' },
                { ...expense('2026-09-01', 500), type: 'dividend' },
                { ...expense('2026-09-01', 2_000), type: 'income' },
            ],
        });
        expect(days[0]).toMatchObject({ spent: 10_000, income: 6_500, available: -3_500 });
    });

    it('ignores movements paid from / credited to a pot', () => {
        const days = run({
            start: '2026-09-01',
            until: '2026-09-01',
            transactions: [expense('2026-09-01', 5_000, { potId: 1 }), { ...expense('2026-09-01', 3_000, { potId: 2 }), type: 'income' }],
        });
        expect(days[0]!.available).toBe(0);
    });

    it('moves money between the budget and pots', () => {
        const days = run({
            start: '2026-09-01',
            until: '2026-09-02',
            recurrences: [{ ...salary(10_000), frequency: 'daily' }],
            potTransfers: [{ direction: 'to_pot', amount: 8_000, date: '2026-09-01' }, { direction: 'from_pot', amount: 1_000, date: '2026-09-02' }],
        });
        expect(days.map((d) => d.available)).toEqual([2_000, 13_000]);
    });
});

describe('dates', () => {
    it('validates calendar dates', () => {
        expect(isLocalDate('2028-02-29')).toBe(true);
        expect(isLocalDate('2027-02-29')).toBe(false);
        expect(isLocalDate('2026-9-1')).toBe(false);
    });

    it('adds days across month and year boundaries', () => {
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    });

    it("computes today in the wallet's timezone", () => {
        const lateEvening = new Date('2026-09-27T22:30:00Z');
        expect(todayIn('Europe/Brussels', lateEvening)).toBe('2026-09-28');
        expect(todayIn('America/New_York', lateEvening)).toBe('2026-09-27');
    });
});
