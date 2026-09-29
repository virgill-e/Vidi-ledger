// Starts the database migrations as soon as the server boots (see
// server/utils/migrations.ts); requests wait for them in the 0.migrations
// middleware.
export default defineNitroPlugin(() => {
    runMigrations().catch(() => { /* logged in runMigrations, answered with 503 by the middleware */ });
});
