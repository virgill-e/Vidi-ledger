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
// Reusable field helpers
// ----------------------------------------------------------------------------

// A number that also accepts numeric strings (the frontend sometimes sends
// strings). Empty string / null are treated as "not provided" (undefined),
// preserving the previous `value ? ... : null` behaviour in the handlers.
const optionalNumber = z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().optional(),
);

// Like optionalNumber, but keeps `null` distinct from "not provided" so a
// handler can tell "clear this field" apart from "leave it untouched".
const clearableNumber = z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().nullable().optional(),
);

const requiredNumber = z.coerce.number();
const isoDateString = z.string().min(1, 'Date is required');
const optionalNote = z.string().nullable().optional();

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
// Expenses
// ----------------------------------------------------------------------------

export const expenseCreateSchema = z.object({
    categoryId: z.coerce.number().int().positive('CategoryId is required'),
    amount: requiredNumber,
    merchant: z.string().min(1, 'Merchant is required'),
    date: isoDateString,
    note: optionalNote,
});

export const expenseUpdateSchema = z.object({
    categoryId: z.coerce.number().int().positive().optional(),
    amount: optionalNumber,
    merchant: z.string().min(1).optional(),
    date: z.string().min(1).optional(),
    note: optionalNote,
});

// ----------------------------------------------------------------------------
// Investments
// ----------------------------------------------------------------------------

const investmentType = z.enum(['buy', 'sell', 'dividend']);

export const investmentCreateSchema = z
    .object({
        type: investmentType,
        asset: z.string().min(1, 'Asset is required'),
        amount: requiredNumber,
        quantity: optionalNumber,
        date: isoDateString,
        note: optionalNote,
    })
    .refine((d) => d.type === 'dividend' || d.quantity !== undefined, {
        message: 'Quantity is required',
        path: ['quantity'],
    });

export const investmentUpdateSchema = z.object({
    type: investmentType.optional(),
    asset: z.string().min(1, 'Asset cannot be empty').optional(),
    amount: optionalNumber,
    quantity: optionalNumber,
    date: z.string().min(1).optional(),
    note: optionalNote,
});

export const investmentTargetUpsertSchema = z.object({
    asset: z.string().min(1, 'Asset is required'),
    targetPercent: z.coerce.number().min(0).max(100),
    currentValueOverride: clearableNumber,
});

export const investmentTargetUpdateSchema = z.object({
    asset: z.string().min(1).optional(),
    targetPercent: z.coerce.number().min(0).max(100).optional(),
    currentValueOverride: clearableNumber,
});

export const investmentGoalUpsertSchema = z.object({
    totalTarget: requiredNumber,
});

// ----------------------------------------------------------------------------
// Categories
// ----------------------------------------------------------------------------

export const categoryCreateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    icon: z.string().min(1, 'Icon is required'),
    color: z.string().min(1, 'Color is required'),
    maxBudget: optionalNumber,
});

export const categoryUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    maxBudget: optionalNumber,
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
