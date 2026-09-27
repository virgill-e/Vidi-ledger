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

// ----------------------------------------------------------------------------
// Transactions & recurrences (amounts in euros on write → cents in the handler)
// ----------------------------------------------------------------------------

const positiveAmount = z.coerce.number().positive('Amount must be positive').max(10_000_000);
const optionalMemo = z.string().trim().max(200).nullable().optional();
const frequency = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

const transactionFields = {
    categoryId: z.coerce.number().int().positive(),
    amount: positiveAmount,
    date: localDateString,
    memo: optionalMemo,
    spreadDays: z.coerce.number().int().min(1).max(365),
    // null = budget; otherwise the pot paying the expense / receiving the income.
    potId: z.coerce.number().int().positive().nullable(),
};

export const transactionCreateSchema = z.object({
    ...transactionFields,
    spreadDays: transactionFields.spreadDays.default(1),
    potId: transactionFields.potId.optional(),
});

// No defaults here: an omitted field must stay untouched.
export const transactionUpdateSchema = z.object(transactionFields).partial();

export const recurrenceCreateSchema = z
    .object({
        categoryId: z.coerce.number().int().positive(),
        amount: positiveAmount,
        frequency,
        startDate: localDateString,
        endDate: localDateString.nullable().optional(),
        memo: optionalMemo,
    })
    .refine((d) => !d.endDate || d.endDate >= d.startDate, {
        message: 'End date must be on or after the start date',
        path: ['endDate'],
    });

// `effectiveFrom`: apply amount/frequency changes from that day on, keeping
// the rule unchanged before it (the past budget does not move).
export const recurrenceUpdateSchema = z.object({
    amount: positiveAmount,
    frequency,
    memo: optionalMemo,
    endDate: localDateString.nullable(),
    effectiveFrom: localDateString,
}).partial();

// ----------------------------------------------------------------------------
// Pots
// ----------------------------------------------------------------------------

const potFields = {
    name: z.string().trim().min(1, 'Name is required').max(40),
    icon: categoryFields.icon,
    color: categoryFields.color,
    targetAmount: positiveAmount.nullable(),
};

export const potCreateSchema = z.object({ ...potFields, targetAmount: potFields.targetAmount.optional() });

export const potUpdateSchema = z.object({ ...potFields, archived: z.boolean() }).partial();

export const potTransferCreateSchema = z.object({
    direction: z.enum(['to_pot', 'from_pot']),
    amount: positiveAmount,
    date: localDateString,
    memo: optionalMemo,
});

// ----------------------------------------------------------------------------
// Investments (quantities / unit prices as exact decimal text → scaled ints)
// ----------------------------------------------------------------------------

const scaledDecimal = (decimals: number, message: string) => z
    .union([z.string(), z.number()])
    .transform((v) => parseScaled(String(v), decimals))
    .refine((v): v is number => v !== null, message);

const quantityField = scaledDecimal(QUANTITY_DECIMALS, 'Invalid quantity');
const feesField = z.coerce.number().min(0).max(1_000_000);
const optionalPotId = z.coerce.number().int().positive().nullable().optional();

export const investmentCreateSchema = z
    .object({
        type: z.enum(['buy', 'sell', 'dividend']),
        categoryId: z.coerce.number().int().positive(),
        // An existing asset, or a name (the asset is created if unknown).
        assetId: z.coerce.number().int().positive().optional(),
        assetName: z.string().trim().min(1).max(60).optional(),
        amount: positiveAmount,
        quantity: quantityField.optional(),
        fees: feesField.default(0),
        date: localDateString,
        memo: optionalMemo,
        potId: optionalPotId,
    })
    .refine((d) => d.assetId !== undefined || d.assetName !== undefined, { message: 'Asset is required', path: ['assetName'] })
    .refine((d) => d.type === 'dividend' || d.quantity !== undefined, { message: 'Quantity is required', path: ['quantity'] });

// No defaults: omitted fields stay untouched. The type and asset never change.
export const investmentUpdateSchema = z.object({
    amount: positiveAmount,
    quantity: quantityField.nullable(),
    fees: feesField,
    date: localDateString,
    memo: optionalMemo,
    potId: optionalPotId,
}).partial();

export const assetUpdateSchema = z.object({
    name: z.string().trim().min(1).max(60),
    ticker: z.string().trim().max(20).nullable(),
    assetClass: z.enum(['etf', 'stock', 'crypto', 'bond', 'other']).nullable(),
}).partial();

export const assetPriceSchema = z.object({
    date: localDateString,
    unitPrice: scaledDecimal(UNIT_PRICE_DECIMALS, 'Invalid price'),
});

// ----------------------------------------------------------------------------
// Admin
// ----------------------------------------------------------------------------

export const adminPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
});
