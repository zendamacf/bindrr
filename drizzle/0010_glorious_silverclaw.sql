UPDATE "printings" SET "language" = 'en' WHERE "language" IS NULL;--> statement-breakpoint
ALTER TABLE "printings" ALTER COLUMN "language" SET DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "printings" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "printings_set_number_language_unique" ON "printings" USING btree ("card_set_id","collectornumber","language");