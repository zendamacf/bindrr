CREATE TABLE "printing_price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"printing_id" integer NOT NULL,
	"recorded_on" date NOT NULL,
	"price" numeric,
	"foilprice" numeric,
	"etchedprice" numeric
);
--> statement-breakpoint
ALTER TABLE "printing_price_history" ADD CONSTRAINT "printing_price_history_printing_id_printings_id_fk" FOREIGN KEY ("printing_id") REFERENCES "public"."printings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "printing_price_history_printing_recorded_on_unique" ON "printing_price_history" USING btree ("printing_id","recorded_on");