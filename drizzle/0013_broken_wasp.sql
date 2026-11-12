CREATE TABLE "wishlist_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"finish" text DEFAULT 'any' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_cards_finish_check" CHECK ("wishlist_cards"."finish" IN ('any', 'nonfoil', 'foil', 'etched')),
	CONSTRAINT "wishlist_cards_quantity_check" CHECK ("wishlist_cards"."quantity" >= 1)
);
--> statement-breakpoint
ALTER TABLE "wishlist_cards" ADD CONSTRAINT "wishlist_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_cards" ADD CONSTRAINT "wishlist_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_cards_unique_idx" ON "wishlist_cards" USING btree ("user_id","card_id","finish");