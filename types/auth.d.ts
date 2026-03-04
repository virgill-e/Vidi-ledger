declare module '#auth-utils' {
    interface User {
        id: number;
        email: string;
        name: string;
        role: string;
    }

    interface UserSession {
        // Add your own fields
    }
}

export { }
