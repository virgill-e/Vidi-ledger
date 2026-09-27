declare module '#auth-utils' {
    interface User {
        id: number;
        email: string;
        name: string;
        isAdmin: boolean;
    }

    interface UserSession {
        // Id of the matching row in the `sessions` table (server/database/schema.ts).
        // Lets requireAuth validate/revoke this specific device against the DB.
        sessionId?: string;
    }
}

export { }
