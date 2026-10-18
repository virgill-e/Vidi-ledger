import { afterEach, describe, expect, it, vi } from 'vitest';

const migrate = vi.fn();
vi.mock('drizzle-orm/postgres-js/migrator', () => ({ migrate: (...args: unknown[]) => migrate(...args) }));
vi.mock('../server/utils/db', () => ({ db: {}, isPostgres: true }));

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
    migrate.mockReset();
});

describe('runMigrations', () => {
    it('retries once the database is reachable again, instead of answering 503 until the next deploy', async () => {
        vi.useFakeTimers();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        migrate.mockRejectedValueOnce(new Error('connect ECONNREFUSED')).mockResolvedValue(undefined);
        const { runMigrations } = await import('../server/utils/migrations');

        await expect(runMigrations()).rejects.toThrow('ECONNREFUSED');
        // Requests during the 5 s wait get the same failure, without hammering the database.
        await expect(runMigrations()).rejects.toThrow('ECONNREFUSED');
        expect(migrate).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(5_000);
        await expect(runMigrations()).resolves.toBeUndefined();
        expect(migrate).toHaveBeenCalledTimes(2);
    });

    it('waits longer after each failure, up to 60 s', async () => {
        vi.useFakeTimers();
        vi.spyOn(console, 'info').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        migrate.mockRejectedValue(new Error('connect ECONNREFUSED'));
        const { runMigrations } = await import('../server/utils/migrations');

        await runMigrations().catch(() => {});
        for (const wait of [5, 10, 20, 40, 60, 60]) await vi.advanceTimersByTimeAsync(wait * 1000);
        const delays = errors.mock.calls.map(([message]) => /retrying in (\d+) s/.exec(String(message))?.[1]);
        expect(delays).toEqual(['5', '10', '20', '40', '60', '60', '60']);
    });
});
