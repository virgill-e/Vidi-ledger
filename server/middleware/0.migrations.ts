// Runs before every other middleware (file name order): no request is served
// on an out-of-date schema. A failed migration answers 503 (details in logs).
export default defineEventHandler(async () => {
    try {
        await runMigrations();
    } catch {
        throw createError({ statusCode: 503, statusMessage: 'Database migration failed' });
    }
});
