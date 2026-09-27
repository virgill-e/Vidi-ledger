// Shapes returned by the API (dates as 'YYYY-MM-DD', money in cents).

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
