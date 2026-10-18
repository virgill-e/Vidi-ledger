// Runs before every other middleware (file name order): no request is served
// on an out-of-date schema. While a migration fails (details in logs, retried
// automatically), requests answer 503.
export default defineEventHandler(async () => {
    try {
        await runMigrations();
    } catch {
        throw createError({ statusCode: 503, statusMessage: 'Database migration failed' });
    }
});
