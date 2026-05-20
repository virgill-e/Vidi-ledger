-- Drizzle Migration: Add CHECK constraint on "investments"."type" column
--
-- Objective: Ensure that only 'buy', 'sell', and 'dividend' values are accepted in the type column.
-- Dual-support details for SQLite and PostgreSQL:
--

-- =================================================================================
-- 1. SQLITE DIALECT INSTRUCTIONS
-- =================================================================================
-- SQLite does not support adding constraints to an existing table directly using `ALTER TABLE ADD CONSTRAINT`.
-- To apply a CHECK constraint in SQLite, the table must be recreated:
--
-- PRAGMA foreign_keys=OFF;
-- BEGIN TRANSACTION;
--
-- -- Rename existing table
-- ALTER TABLE "investments" RENAME TO "investments_old";
--
-- -- Create new table with the CHECK constraint
-- CREATE TABLE "investments" (
--     "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
--     "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
--     "type" TEXT NOT NULL CHECK(type IN ('buy', 'sell', 'dividend')),
--     "asset" TEXT NOT NULL,
--     "amount" INTEGER NOT NULL,
--     "quantity" REAL NOT NULL,
--     "date" INTEGER NOT NULL,
--     "note" TEXT,
--     "created_at" INTEGER NOT NULL
-- );
--
-- -- Transfer all data from old to new table
-- INSERT INTO "investments" ("id", "user_id", "type", "asset", "amount", "quantity", "date", "note", "created_at")
-- SELECT "id", "user_id", "type", "asset", "amount", "quantity", "date", "note", "created_at" FROM "investments_old";
--
-- -- Drop old table
-- DROP TABLE "investments_old";
--
-- COMMIT;
-- PRAGMA foreign_keys=ON;


-- =================================================================================
-- 2. POSTGRESQL DIALECT INSTRUCTIONS
-- =================================================================================
-- PostgreSQL supports CHECK constraints natively via direct schema modification:
--

ALTER TABLE "investments" ADD CONSTRAINT "check_investment_type" CHECK (type IN ('buy', 'sell', 'dividend'));
