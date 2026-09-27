CREATE TABLE "asset_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"date" text NOT NULL,
	"unit_price" bigint NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "asset_prices_unit_price_check" CHECK ("asset_prices"."unit_price" > 0)
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"ticker" text,
	"asset_class" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "assets_class_check" CHECK ("assets"."asset_class" IS NULL OR "assets"."asset_class" IN ('etf', 'stock', 'crypto', 'bond', 'other'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"kind" text NOT NULL,
	"is_investment" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "categories_kind_check" CHECK ("categories"."kind" IN ('expense', 'income'))
);
--> statement-breakpoint
CREATE TABLE "pot_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"pot_id" integer NOT NULL,
	"direction" text NOT NULL,
	"amount" integer NOT NULL,
	"date" text NOT NULL,
	"memo" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "pot_transfers_direction_check" CHECK ("pot_transfers"."direction" IN ('to_pot', 'from_pot')),
	CONSTRAINT "pot_transfers_amount_check" CHECK ("pot_transfers"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "pots" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"target_amount" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "pots_target_check" CHECK ("pots"."target_amount" IS NULL OR "pots"."target_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "recurrences" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"kind" text NOT NULL,
	"amount" integer NOT NULL,
	"frequency" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"memo" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "recurrences_kind_check" CHECK ("recurrences"."kind" IN ('expense', 'income')),
	CONSTRAINT "recurrences_frequency_check" CHECK ("recurrences"."frequency" IN ('daily', 'weekly', 'monthly', 'yearly')),
	CONSTRAINT "recurrences_amount_check" CHECK ("recurrences"."amount" > 0),
	CONSTRAINT "recurrences_dates_check" CHECK ("recurrences"."end_date" IS NULL OR "recurrences"."end_date" >= "recurrences"."start_date")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp NOT NULL,
	"last_active_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"amount" integer NOT NULL,
	"memo" text,
	"pot_id" integer,
	"spread_days" integer DEFAULT 1 NOT NULL,
	"asset_id" integer,
	"quantity" bigint,
	"fees" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "transactions_type_check" CHECK ("transactions"."type" IN ('expense', 'income', 'buy', 'sell', 'dividend')),
	CONSTRAINT "transactions_amount_check" CHECK ("transactions"."amount" > 0),
	CONSTRAINT "transactions_fees_check" CHECK ("transactions"."fees" >= 0),
	CONSTRAINT "transactions_spread_check" CHECK ("transactions"."spread_days" = 1 OR ("transactions"."type" = 'expense' AND "transactions"."spread_days" > 1)),
	CONSTRAINT "transactions_investment_check" CHECK (
        ("transactions"."type" IN ('buy', 'sell') AND "transactions"."asset_id" IS NOT NULL AND "transactions"."quantity" IS NOT NULL AND "transactions"."quantity" > 0)
        OR ("transactions"."type" = 'dividend' AND "transactions"."asset_id" IS NOT NULL AND ("transactions"."quantity" IS NULL OR "transactions"."quantity" >= 0))
        OR ("transactions"."type" IN ('expense', 'income') AND "transactions"."asset_id" IS NULL AND "transactions"."quantity" IS NULL)
    )
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"timezone" text DEFAULT 'Europe/Brussels' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "wallets_dates_check" CHECK ("wallets"."end_date" IS NULL OR "wallets"."end_date" >= "wallets"."start_date")
);
--> statement-breakpoint
ALTER TABLE "asset_prices" ADD CONSTRAINT "asset_prices_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pot_transfers" ADD CONSTRAINT "pot_transfers_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pot_transfers" ADD CONSTRAINT "pot_transfers_pot_id_pots_id_fk" FOREIGN KEY ("pot_id") REFERENCES "public"."pots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pots" ADD CONSTRAINT "pots_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pot_id_pots_id_fk" FOREIGN KEY ("pot_id") REFERENCES "public"."pots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_prices_asset_date_idx" ON "asset_prices" USING btree ("asset_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_wallet_name_key_idx" ON "assets" USING btree ("wallet_id","name_key");--> statement-breakpoint
CREATE INDEX "categories_wallet_idx" ON "categories" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "pot_transfers_wallet_date_idx" ON "pot_transfers" USING btree ("wallet_id","date");--> statement-breakpoint
CREATE INDEX "pots_wallet_idx" ON "pots" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "recurrences_wallet_idx" ON "recurrences" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_wallet_date_idx" ON "transactions" USING btree ("wallet_id","date");--> statement-breakpoint
CREATE INDEX "transactions_asset_date_idx" ON "transactions" USING btree ("asset_id","date");