// Calendar helpers for business dates stored as 'YYYY-MM-DD' strings.
// All arithmetic is done on "day numbers" (days since 1970-01-01, UTC) so it is
// independent of the machine's timezone. Auto-imported in app/ and server/.

export type LocalDate = string;

const MS_PER_DAY = 86_400_000;
const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const toDayNumber = (date: LocalDate): number => {
    const [y, m, d] = date.split('-').map(Number) as [number, number, number];
    return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
};

export const fromDayNumber = (day: number): LocalDate => new Date(day * MS_PER_DAY).toISOString().slice(0, 10);

export const addDays = (date: LocalDate, days: number): LocalDate => fromDayNumber(toDayNumber(date) + days);

/** True for a real calendar date in 'YYYY-MM-DD' form (rejects '2026-02-30'). */
export const isLocalDate = (value: string): boolean => LOCAL_DATE_RE.test(value) && fromDayNumber(toDayNumber(value)) === value;

/** `month` is 1-based. */
export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Today's date in an IANA timezone, e.g. todayIn('Europe/Brussels'). */
export const todayIn = (timeZone: string, now: Date = new Date()): LocalDate =>
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/** `date` moved into [min, max] (either bound optional), e.g. today → the wallet's first day. */
export const clampDate = (date: LocalDate, min?: LocalDate | null, max?: LocalDate | null): LocalDate => {
    if (min && date < min) return min;
    if (max && date > max) return max;
    return date;
};
