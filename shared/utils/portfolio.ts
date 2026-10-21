// Investment positions (spec §2.6). Pure functions, no I/O.
//
// Quantities are integers scaled by QUANTITY_SCALE (10⁸), money in cents.
// A buy's `amount` is the cash paid (fees included); a sell's is the net cash
// received. A reward (staking, airdrop) brings units for free: amount 0, so the
// PRU goes down. There is no market value: positions are followed at cost.

export const QUANTITY_DECIMALS = 8;
export const QUANTITY_SCALE = 10 ** QUANTITY_DECIMALS;

/**
 * Exact decimal text → scaled integer ("1,5" with 8 decimals → 150000000),
 * without going through floats. Null if invalid, not positive, or too precise.
 */
export const parseScaled = (text: string, decimals: number): number | null => {
    const normalized = String(text).replace(/[\s  ]/g, '').replace(',', '.');
    const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);
    if (!match) return null;
    const fraction = match[2] ?? '';
    if (fraction.length > decimals) return null;
    const value = Number(match[1]! + fraction.padEnd(decimals, '0'));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
};

/** Scaled integer → decimal text without trailing zeros (150000000 → "1,5"). */
export const formatScaled = (value: number, decimals: number): string => {
    const negative = value < 0;
    const digits = String(Math.abs(value)).padStart(decimals + 1, '0');
    const int = digits.slice(0, -decimals);
    const fraction = digits.slice(-decimals).replace(/0+$/, '');
    return `${negative ? '-' : ''}${Number(int).toLocaleString('fr-FR')}${fraction ? `,${fraction}` : ''}`;
};

export const TRADE_TYPES = ['buy', 'sell', 'dividend', 'reward'] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

/** True for a movement on an asset (buy, sell, dividend, reward). */
export const isTrade = (type: string): type is TradeType => (TRADE_TYPES as readonly string[]).includes(type);

/** Buys and rewards add units to a position. */
export const addsUnits = (type: string) => type === 'buy' || type === 'reward';

export interface Trade {
    id: number;
    type: TradeType;
    date: string;
    amount: number; // cents
    quantity: number | null; // scaled
}

export interface Position {
    /** Units held, scaled. */
    quantity: number;
    /** Cost basis of the units held (weighted average), cents. */
    costBasis: number;
    /** Average cost per unit ("PRU"), cents; null when nothing is held. */
    averageCost: number | null;
    /** Cash put in by buys, cents. */
    invested: number;
    /** Sale proceeds minus the cost of the units sold, cents. */
    realizedPnL: number;
    dividends: number;
    /** Units received for free (staking, airdrops), scaled. */
    rewards: number;
}

/** Trades in the order they happened: by date, then by insertion (id). */
export const sortTrades = <T extends { date: string; id: number }>(trades: T[]): T[] =>
    [...trades].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));

/**
 * Units held after each trade, in chronological order; the first index where
 * the holding goes negative, or -1 if it never does (a sale cannot exceed
 * what is held at that date).
 */
export const firstOversell = (trades: Trade[]): number => {
    let held = 0;
    const sorted = sortTrades(trades);
    for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i]!;
        if (addsUnits(t.type)) held += t.quantity ?? 0;
        else if (t.type === 'sell') held -= t.quantity ?? 0;
        if (held < 0) return i;
    }
    return -1;
};

/** Unit price paid/received by a trade, cents per unit; null for dividends and rewards. */
export const tradeUnitPrice = (t: Pick<Trade, 'type' | 'amount' | 'quantity'>): number | null =>
    (t.type !== 'buy' && t.type !== 'sell') || !t.quantity ? null : (t.amount * QUANTITY_SCALE) / t.quantity;

/** PRU after each buy, sell or reward, for the price chart. */
export const averageCostHistory = (trades: Trade[]): { date: string; averageCost: number | null }[] => {
    const points: { date: string; averageCost: number | null }[] = [];
    let quantity = 0;
    let cost = 0;
    for (const t of sortTrades(trades)) {
        if (t.type === 'dividend') continue;
        const q = t.quantity ?? 0;
        if (addsUnits(t.type)) {
            quantity += q;
            cost += t.amount;
        } else {
            const avg = quantity > 0 ? cost / quantity : 0;
            cost -= avg * Math.min(q, quantity);
            quantity -= q;
        }
        points.push({ date: t.date, averageCost: quantity > 0 ? (cost * QUANTITY_SCALE) / quantity : null });
    }
    return points;
};

export const computePosition = (trades: Trade[]): Position => {
    let quantity = 0;
    let cost = 0;
    let invested = 0;
    let realized = 0;
    let dividends = 0;
    let rewards = 0;

    for (const t of sortTrades(trades)) {
        const q = t.quantity ?? 0;
        if (t.type === 'buy') {
            quantity += q;
            cost += t.amount;
            invested += t.amount;
        } else if (t.type === 'sell') {
            // Units leave at the weighted average cost of what is held.
            const avg = quantity > 0 ? cost / quantity : 0;
            const soldCost = avg * Math.min(q, quantity);
            cost -= soldCost;
            quantity -= q;
            realized += t.amount - soldCost;
        } else if (t.type === 'reward') {
            quantity += q;
            rewards += q;
        } else {
            dividends += t.amount;
        }
    }

    if (quantity <= 0) {
        quantity = Math.max(0, quantity);
        cost = 0;
    }

    return {
        quantity,
        costBasis: Math.round(cost),
        averageCost: quantity > 0 ? (cost * QUANTITY_SCALE) / quantity : null,
        invested,
        realizedPnL: Math.round(realized),
        dividends,
        rewards,
    };
};
