// Daily budget engine (spec: docs/v2/analyse.md §2.2). Pure functions, no I/O.
//
// Recurring incomes/expenses are smoothed into a per-day allowance; one-off
// movements hit the day they happen (or are spread over N days); whatever is
// left carries over to the next day, surplus and deficit alike:
//
//   available(d) = available(d-1) + allowance(d) + income(d) - spent(d) - transfers(d)
//
// Shares are kept as fractional cents and only rounded on output, like the
// reference app (2 335 € monthly in a 30-day month = 7 783.33… cents a day).

import { daysInMonth, fromDayNumber, isLeapYear, toDayNumber, type LocalDate } from './dates';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BudgetWallet {
    startDate: LocalDate;
    endDate: LocalDate | null;
}

export interface BudgetRecurrence {
    kind: 'expense' | 'income';
    amount: number; // cents
    frequency: Frequency;
    startDate: LocalDate;
    endDate: LocalDate | null;
}

export interface BudgetTransaction {
    type: 'expense' | 'income' | 'buy' | 'sell' | 'dividend';
    date: LocalDate;
    amount: number; // cents
    potId: number | null; // set = paid from / credited to a pot, not the budget
    spreadDays: number;
}

export interface BudgetPotTransfer {
    direction: 'to_pot' | 'from_pot';
    amount: number; // cents
    date: LocalDate;
}

export interface BudgetDay {
    date: LocalDate;
    /** Leftover from the previous day ("Excédent"), cents. */
    carry: number;
    /** Smoothed recurring incomes minus expenses ("Budget quotidien"), cents. */
    allowance: number;
    /** One-off incomes credited to the budget, cents. */
    income: number;
    /** One-off expenses/buys paid from the budget (spread shares included), cents. */
    spent: number;
    /** Net budget → pots transfers (negative when money came back), cents. */
    transfers: number;
    /** What is left at the end of the day ("Budget du jour"), cents. */
    available: number;
}

const OUTFLOW_TYPES = new Set(['expense', 'buy']);

/**
 * Fractional cents a recurrence contributes on `date` (0 outside its period).
 * Monthly/yearly amounts are split over the actual calendar month/year,
 * weekly ones over 7 days.
 */
export const recurrenceShareOn = (
    r: Pick<BudgetRecurrence, 'amount' | 'frequency' | 'startDate' | 'endDate'>,
    date: LocalDate,
): number => {
    if (date < r.startDate || (r.endDate !== null && date > r.endDate)) return 0;
    return dailyAmount(r.amount, r.frequency, date);
};

/** Fractional cents per day for `amount` repeated at `frequency`, in the period containing `date`. */
export const dailyAmount = (amount: number, frequency: Frequency, date: LocalDate): number => {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    switch (frequency) {
        case 'daily': return amount;
        case 'weekly': return amount / 7;
        case 'monthly': return amount / daysInMonth(year, month);
        case 'yearly': return amount / (isLeapYear(year) ? 366 : 365);
    }
};

/**
 * Day-by-day budget from the wallet's start date to `until` (inclusive,
 * capped at the wallet's end date). Movements dated before the start date
 * are ignored. Returns [] if the wallet has not started by `until`.
 */
export const computeBudget = (input: {
    wallet: BudgetWallet;
    recurrences: BudgetRecurrence[];
    transactions: BudgetTransaction[];
    potTransfers: BudgetPotTransfer[];
    until: LocalDate;
}): BudgetDay[] => {
    const { wallet, recurrences, transactions, potTransfers } = input;
    const first = toDayNumber(wallet.startDate);
    const lastDate = wallet.endDate !== null && wallet.endDate < input.until ? wallet.endDate : input.until;
    const last = toDayNumber(lastDate);
    if (last < first) return [];

    const length = last - first + 1;
    const income = new Array<number>(length).fill(0);
    const spent = new Array<number>(length).fill(0);
    const transfers = new Array<number>(length).fill(0);
    const inRange = (i: number) => i >= 0 && i < length;

    for (const tx of transactions) {
        if (tx.potId !== null) continue;
        const i = toDayNumber(tx.date) - first;
        if (OUTFLOW_TYPES.has(tx.type)) {
            const days = Math.max(1, tx.spreadDays);
            for (let k = 0; k < days; k++) {
                if (inRange(i + k)) spent[i + k]! += tx.amount / days;
            }
        } else if (inRange(i)) {
            income[i]! += tx.amount;
        }
    }

    for (const t of potTransfers) {
        const i = toDayNumber(t.date) - first;
        if (inRange(i)) transfers[i]! += t.direction === 'to_pot' ? t.amount : -t.amount;
    }

    const days: BudgetDay[] = [];
    let carry = 0;
    for (let i = 0; i < length; i++) {
        const date = fromDayNumber(first + i);
        let allowance = 0;
        for (const r of recurrences) {
            const share = recurrenceShareOn(r, date);
            allowance += r.kind === 'income' ? share : -share;
        }
        const available = carry + allowance + income[i]! - spent[i]! - transfers[i]!;
        days.push({
            date,
            carry: Math.round(carry),
            allowance: Math.round(allowance),
            income: Math.round(income[i]!),
            spent: Math.round(spent[i]!),
            transfers: Math.round(transfers[i]!),
            available: Math.round(available),
        });
        carry = available;
    }
    return days;
};
