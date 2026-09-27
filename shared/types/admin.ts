// GET /api/admin/users
export interface AdminUser {
    id: number;
    email: string;
    name: string;
    isAdmin: boolean;
    createdAt: string;
    lastActiveAt: string | null;
    wallet: { name: string; startDate: string } | null;
}
