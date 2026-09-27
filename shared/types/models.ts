// Shapes returned by the API (dates as 'YYYY-MM-DD', money in cents).

import type { Frequency } from '../utils/budget';
import type { Position } from '../utils/portfolio';

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

export type AssetClass = 'etf' | 'stock' | 'crypto' | 'bond' | 'other';

export interface Asset {
    id: number;
    name: string;
    ticker: string | null;
    assetClass: AssetClass | null;
}

// GET /api/assets
export interface AssetSummary extends Asset {
    position: Position;
    tradeCount: number;
    lastTradeDate: string | null;
}

export interface AssetPrice {
    id: number;
    date: string;
    /** × UNIT_PRICE_SCALE */
    unitPrice: number;
}

// GET /api/assets/:id
export interface AssetDetail {
    asset: Asset;
    position: Position;
    /** Newest first; `unitPrice` in cents per unit (null for dividends). */
    trades: (Transaction & { unitPrice: number | null })[];
    prices: AssetPrice[];
    averageCostHistory: { date: string; averageCost: number | null }[];
}
