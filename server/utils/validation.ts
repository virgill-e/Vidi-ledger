import type { H3Event } from 'h3';
import { z } from 'zod';

/**
 * Parse and validate a request body against a Zod schema.
 * On failure, throws a clean 400 with the first issue as the status message
 * and the full list of issues in `data.issues`.
 *
 * Auto-imported by Nitro (like `defineRateLimit`) — no import needed in handlers.
 */
export const validateBody = async <T>(event: H3Event, schema: z.ZodType<T>): Promise<T> => {
    const body = await readBody(event);
    const result = schema.safeParse(body);

    if (!result.success) {
        const issues = result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
        }));
        const first = issues[0];
        throw createError({
            statusCode: 400,
            statusMessage: first ? (first.path ? `${first.path}: ${first.message}` : first.message) : 'Invalid request body',
            data: { issues },
        });
    }

    return result.data;
};

// ----------------------------------------------------------------------------
// Auth
// ----------------------------------------------------------------------------

// Login accepts any non-empty email string (must match whatever is already
// stored), so we do not enforce the email format here.
export const loginSchema = z.object({
    email: z.string().min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: z.email('A valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(1, 'Name is required'),
});

// ----------------------------------------------------------------------------
// User
// ----------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export const passwordUpdateSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});
