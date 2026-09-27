// Amount input helpers: the user types euros ("12,50", "1 234.5"); the API
// takes euros on write and returns cents.

/** Parsed euros, or null if the text is not a valid positive amount (max 2 decimals). */
export const parseAmount = (text: string): number | null => {
    const normalized = text.replace(/[\s  ]/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
    const value = Number(normalized);
    return value > 0 ? value : null;
};

/** Cents → editable text, e.g. 1050 → "10,50". */
export const centsToInput = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',');
