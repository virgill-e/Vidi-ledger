import type { BudgetDay } from '../utils/budget';

// GET /api/budget
export interface BudgetResponse {
    today: string;
    startDate: string;
    endDate: string | null;
    days: BudgetDay[];
}
