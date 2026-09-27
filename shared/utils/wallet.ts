// Wallet settings shared by the API (validation) and the app (form options).

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_TIMEZONE = 'Europe/Brussels';

export const isValidTimeZone = (timeZone: string): boolean => {
    try {
        new Intl.DateTimeFormat('en', { timeZone });
        return true;
    } catch {
        return false;
    }
};
