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

// ----------------------------------------------------------------------------
// Shared field helpers
// ----------------------------------------------------------------------------

const localDateString = z.string().refine(isLocalDate, 'Invalid date (expected YYYY-MM-DD)');

// ----------------------------------------------------------------------------
// Wallet
// ----------------------------------------------------------------------------

const walletFields = {
    name: z.string().trim().min(1, 'Name is required').max(60),
    startDate: localDateString,
    endDate: localDateString.nullable(),
    currency: z.enum(SUPPORTED_CURRENCIES),
    timezone: z.string().refine(isValidTimeZone, 'Invalid timezone'),
};

export const walletCreateSchema = z
    .object({ ...walletFields, endDate: walletFields.endDate.optional() })
    .refine((d) => !d.endDate || d.endDate >= d.startDate, {
        message: 'End date must be on or after the start date',
        path: ['endDate'],
    });

// Date order is checked by the handler, against the merged stored values.
export const walletUpdateSchema = z.object(walletFields).partial();

// ----------------------------------------------------------------------------
// Categories
// ----------------------------------------------------------------------------

const categoryFields = {
    name: z.string().trim().min(1, 'Name is required').max(40),
    icon: z.string().regex(/^lucide:[a-z0-9-]+$/, 'Invalid icon'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color'),
};

// Investment categories are only created with the wallet (seeded), so the
// flag is not accepted here.
export const categoryCreateSchema = z.object({
    kind: z.enum(['expense', 'income']),
    ...categoryFields,
});

export const categoryUpdateSchema = z.object({
    ...categoryFields,
    archived: z.boolean(),
}).partial();
