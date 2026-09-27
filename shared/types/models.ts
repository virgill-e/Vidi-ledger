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
