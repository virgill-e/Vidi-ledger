// Display helpers. Amounts are integer cents; the currency is the wallet's.
// Auto-imported by Nuxt (composables/).
export const useFormat = () => {
    const { wallet } = useWallet();

    const formatMoney = (cents: number, options: { signed?: boolean } = {}) => {
        const formatted = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: wallet.value?.currency ?? 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: options.signed ? 'exceptZero' : 'auto',
        }).format(cents / 100);
        return formatted;
    };

    /** 'YYYY-MM-DD' → e.g. "26 sept. 2026" (no timezone shift). */
    const formatDate = (
        date: string,
        options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
    ) => new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { ...options, timeZone: 'UTC' });

    return { formatMoney, formatDate };
};
