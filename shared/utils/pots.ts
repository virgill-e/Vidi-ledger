// Savings pot balances (spec §2.4). Pure functions, no I/O.

import { recurrenceShareOn, type Frequency } from './budget';
import { daysInMonth, fromDayNumber, toDayNumber, type LocalDate } from './dates';

export interface PotTransferRow {
    potId: number;
    direction: 'to_pot' | 'from_pot';
    amount: number; // cents
}

export interface PotTransactionRow {
    potId: number | null;
    type: 'expense' | 'income' | 'buy' | 'sell' | 'dividend';
    amount: number; // cents
}

/** A recurring contribution from the budget to a pot ("épargne programmée"). */
export interface PotRecurrenceRow {
    potId: number;
    amount: number; // cents per period
    frequency: Frequency;
    startDate: LocalDate;
    endDate: LocalDate | null;
}

/** Last day of the period of `frequency` that contains `date`. */
const periodEnd = (frequency: Frequency, date: LocalDate, ruleStart: LocalDate): LocalDate => {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    switch (frequency) {
        case 'daily': return date;
        case 'weekly': {
            // 7-day blocks counted from the rule's first day.
            const offset = toDayNumber(date) - toDayNumber(ruleStart);
            return fromDayNumber(toDayNumber(ruleStart) + Math.floor(offset / 7) * 7 + 6);
        }
        case 'monthly': return `${date.slice(0, 7)}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
        case 'yearly': return `${year}-12-31`;
    }
};

/**
 * What a recurring contribution has put into its pot by `asOf`, period by
 * period. The budget pays it day by day (like any recurring expense), but the
 * pot receives each period in full on its first day — so a monthly 500 € is
 * available on the 1st for a purchase paid from the pot. Only days inside the
 * wallet period count, exactly as in the budget.
 */
export const recurringPotCredits = (
    rule: PotRecurrenceRow,
    asOf: LocalDate,
    wallet: { startDate: LocalDate; endDate: LocalDate | null },
): { date: LocalDate; amount: number }[] => {
    const first = rule.startDate > wallet.startDate ? rule.startDate : wallet.startDate;
    const limits = [rule.endDate, wallet.endDate].filter((d): d is LocalDate => d !== null);
    const last = limits.length ? limits.reduce((a, b) => (a < b ? a : b)) : null;

    const credits: { date: LocalDate; amount: number }[] = [];
    let cursor = first;
    while (cursor <= asOf && (last === null || cursor <= last)) {
        const end = periodEnd(rule.frequency, cursor, rule.startDate);
        const segmentEnd = last !== null && last < end ? last : end;
        let cents = 0;
        for (let day = toDayNumber(cursor); day <= toDayNumber(segmentEnd); day++) {
            cents += recurrenceShareOn(rule, fromDayNumber(day));
        }
        credits.push({ date: cursor, amount: Math.round(cents) });
        cursor = fromDayNumber(toDayNumber(end) + 1);
    }
    return credits;
};

/**
 * Balance per pot, in cents: transfers from the budget, incomes credited to
 * the pot and recurring contributions (`credits`, see recurringPotCredits),
 * minus transfers back to the budget and expenses/buys paid from it.
 */
export const potBalances = (
    transfers: PotTransferRow[],
    transactions: PotTransactionRow[],
    credits: { potId: number; amount: number }[] = [],
): Map<number, number> => {
    const balances = new Map<number, number>();
    const add = (potId: number, cents: number) => balances.set(potId, (balances.get(potId) ?? 0) + cents);

    for (const c of credits) add(c.potId, c.amount);
    for (const t of transfers) add(t.potId, t.direction === 'to_pot' ? t.amount : -t.amount);
    for (const tx of transactions) {
        if (tx.potId === null) continue;
        add(tx.potId, tx.type === 'expense' || tx.type === 'buy' ? -tx.amount : tx.amount);
    }
    return balances;
};
