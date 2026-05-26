DROP INDEX "collection_printings_user_printing_foil_unique_idx";--> statement-breakpoint
ALTER TABLE "collection_logs" ADD COLUMN "etched" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_printings" ADD COLUMN "etched" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "printings" ADD COLUMN "etchedprice" numeric;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_printings_unique_idx" ON "collection_printings" USING btree ("user_id","printing_id","foil","etched");