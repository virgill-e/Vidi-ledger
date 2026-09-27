export const FREQUENCY_LABELS: Record<Frequency, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel',
};

export const SPREAD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 60, 90, 180, 365];

export const TRADE_LABELS: Record<'buy' | 'sell' | 'dividend', string> = {
    buy: 'Achat',
    sell: 'Vente',
    dividend: 'Dividende',
};

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
    etf: 'ETF',
    stock: 'Action',
    crypto: 'Crypto',
    bond: 'Obligation',
    other: 'Autre',
};

export const API_ERRORS: Record<string, string> = {
    'Quantity exceeds the units held at that date': 'Quantité supérieure aux parts détenues à cette date.',
    'Insufficient pot balance': 'Solde du pot insuffisant.',
    'An asset already has this name': 'Un autre actif porte déjà ce nom.',
};

/** French message for an API error, falling back to the raw status message. */
export const apiErrorMessage = (err: any, fallback: string): string => {
    const message = err?.data?.statusMessage;
    return (message && API_ERRORS[message]) || message || fallback;
};
