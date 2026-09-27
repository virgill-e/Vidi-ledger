// Shapes returned by the API (dates as 'YYYY-MM-DD', money in cents).

import type { Frequency } from '../utils/budget';

export type CategoryKind = 'expense' | 'income';

export interface Wallet {
    id: number;
    name: string;
    startDate: string;
    endDate: string | null;
    currency: string;
    timezone: string;
}

export interface Category {
    id: number;
    kind: CategoryKind;
    isInvestment: boolean;
    name: string;
    icon: string;
    color: string;
    position: number;
    archivedAt: string | null;
}

export type TransactionType = 'expense' | 'income' | 'buy' | 'sell' | 'dividend';

export interface Transaction {
    id: number;
    categoryId: number;
    type: TransactionType;
    date: string;
    amount: number;
    memo: string | null;
    potId: number | null;
    spreadDays: number;
    assetId: number | null;
    quantity: number | null;
    fees: number;
}

export interface Recurrence {
    id: number;
    categoryId: number;
    kind: CategoryKind;
    amount: number;
    frequency: Frequency;
    startDate: string;
    endDate: string | null;
    memo: string | null;
}

export interface Pot {
    id: number;
    name: string;
    icon: string;
    color: string;
    targetAmount: number | null;
    position: number;
    archivedAt: string | null;
    /** Current balance, cents. */
    balance: number;
}

// GET /api/pots/:id/movements — `amount` is signed from the pot's point of view.
export type PotMovement =
    | { kind: 'transfer'; id: number; date: string; memo: string | null; direction: 'to_pot' | 'from_pot'; amount: number }
    | { kind: 'transaction'; id: number; date: string; memo: string | null; type: TransactionType; categoryId: number; amount: number };
