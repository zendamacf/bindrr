ALTER TABLE "card_types" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "price_histories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "card_types" CASCADE;--> statement-breakpoint
DROP TABLE "price_histories" CASCADE;--> statement-breakpoint
ALTER TABLE "cards" DROP CONSTRAINT "cards_card_type_id_card_types_id_fk";
--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN "card_type_id";