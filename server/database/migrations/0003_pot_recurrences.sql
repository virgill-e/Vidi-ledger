ALTER TABLE "recurrences" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrences" ADD COLUMN "pot_id" integer;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_pot_id_pots_id_fk" FOREIGN KEY ("pot_id") REFERENCES "public"."pots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_target_check" CHECK (
        ("recurrences"."pot_id" IS NULL AND "recurrences"."category_id" IS NOT NULL)
        OR ("recurrences"."pot_id" IS NOT NULL AND "recurrences"."category_id" IS NULL AND "recurrences"."kind" = 'expense')
    );