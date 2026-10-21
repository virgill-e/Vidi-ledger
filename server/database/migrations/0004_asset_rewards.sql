ALTER TABLE "transactions" DROP CONSTRAINT "transactions_type_check";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_amount_check";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_investment_check";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_type_check" CHECK ("transactions"."type" IN ('expense', 'income', 'buy', 'sell', 'dividend', 'reward'));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_check" CHECK (("transactions"."type" = 'reward' AND "transactions"."amount" = 0) OR ("transactions"."type" <> 'reward' AND "transactions"."amount" > 0));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investment_check" CHECK (
        ("transactions"."type" IN ('buy', 'sell') AND "transactions"."asset_id" IS NOT NULL AND "transactions"."quantity" IS NOT NULL AND "transactions"."quantity" > 0)
        OR ("transactions"."type" = 'reward' AND "transactions"."asset_id" IS NOT NULL AND "transactions"."quantity" IS NOT NULL AND "transactions"."quantity" > 0 AND "transactions"."pot_id" IS NULL)
        OR ("transactions"."type" = 'dividend' AND "transactions"."asset_id" IS NOT NULL AND ("transactions"."quantity" IS NULL OR "transactions"."quantity" >= 0))
        OR ("transactions"."type" IN ('expense', 'income') AND "transactions"."asset_id" IS NULL AND "transactions"."quantity" IS NULL)
    );