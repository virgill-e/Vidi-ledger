export type InvestmentType = 'buy' | 'sell' | 'dividend';

export interface DividendSummary {
    asset: string;
    totalDividends: number;
    lastDividendDate: Date | null;
}
