// Savings pot balances (spec §2.4). Pure functions, no I/O.

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

/**
 * Balance per pot, in cents: transfers from the budget and incomes credited
 * to the pot, minus transfers back to the budget and expenses/buys paid from it.
 */
export const potBalances = (transfers: PotTransferRow[], transactions: PotTransactionRow[]): Map<number, number> => {
    const balances = new Map<number, number>();
    const add = (potId: number, cents: number) => balances.set(potId, (balances.get(potId) ?? 0) + cents);

    for (const t of transfers) add(t.potId, t.direction === 'to_pot' ? t.amount : -t.amount);
    for (const tx of transactions) {
        if (tx.potId === null) continue;
        add(tx.potId, tx.type === 'expense' || tx.type === 'buy' ? -tx.amount : tx.amount);
    }
    return balances;
};
