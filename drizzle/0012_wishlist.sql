CREATE TABLE "wishlist_printings" (
	"id" serial PRIMARY KEY NOT NULL,
	"printing_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"finish" text DEFAULT 'any' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_printings_finish_check" CHECK ("wishlist_printings"."finish" IN ('any', 'nonfoil', 'foil', 'etched')),
	CONSTRAINT "wishlist_printings_quantity_check" CHECK ("wishlist_printings"."quantity" >= 1)
);
--> statement-breakpoint
ALTER TABLE "wishlist_printings" ADD CONSTRAINT "wishlist_printings_printing_id_printings_id_fk" FOREIGN KEY ("printing_id") REFERENCES "public"."printings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_printings" ADD CONSTRAINT "wishlist_printings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_printings_unique_idx" ON "wishlist_printings" USING btree ("user_id","printing_id","finish");