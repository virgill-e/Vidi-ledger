// Centralized fr-FR / EUR formatting helpers.
// Amounts are stored as integer cents, so every currency helper divides by 100.
// Auto-imported by Nuxt (composables/).

type CurrencyOptions = {
    /** Show 2 decimals (default rounds to whole euros). */
    exact?: boolean;
    /** Drop decimals only when the amount is a round number of euros. */
    minimal?: boolean;
    /** Compact notation, e.g. "1,2 k €". */
    compact?: boolean;
};

export const useFormat = () => {
    const formatCurrency = (cents: number, options: CurrencyOptions = {}) => {
        const { exact = false, minimal = false, compact = false } = options;
        const value = cents / 100;

        if (compact) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1,
            }).format(value);
        }

        const maximumFractionDigits = minimal ? (cents % 100 === 0 ? 0 : 2) : exact ? 2 : 0;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits,
        }).format(value);
    };

    const formatDate = (
        date: string | number | Date,
        options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
    ) => new Date(date).toLocaleDateString('fr-FR', options);

    return { formatCurrency, formatDate };
};
