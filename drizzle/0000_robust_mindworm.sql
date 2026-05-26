CREATE TABLE "card_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"released" date NOT NULL,
	"tcgplayer_groupid" integer
);
--> statement-breakpoint
CREATE TABLE "card_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"colors" text,
	"multifaced" boolean DEFAULT false NOT NULL,
	"cmc" numeric,
	"typeline" text,
	"manacost" text,
	"card_type_id" integer
);
--> statement-breakpoint
CREATE TABLE "collection_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"printing_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"change" integer NOT NULL,
	"foil" boolean DEFAULT false NOT NULL,
	"occurred" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_printings" (
	"id" serial PRIMARY KEY NOT NULL,
	"printing_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"foil" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"exchangerate" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"printing_id" integer NOT NULL,
	"price" numeric,
	"foilprice" numeric,
	"pricetype" text,
	"created" date DEFAULT now() NOT NULL,
	CONSTRAINT "price_histories_created_unique" UNIQUE("created")
);
--> statement-breakpoint
CREATE TABLE "printings" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"collectornumber" text NOT NULL,
	"card_set_id" integer NOT NULL,
	"multiverse_id" integer,
	"price" numeric,
	"foilprice" numeric,
	"tcgplayer_productid" text,
	"scryfall_id" text,
	"rarity" varchar(1),
	"language" text,
	CONSTRAINT "printings_scryfall_id_unique" UNIQUE("scryfall_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_card_type_id_card_types_id_fk" FOREIGN KEY ("card_type_id") REFERENCES "public"."card_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_logs" ADD CONSTRAINT "collection_logs_printing_id_printings_id_fk" FOREIGN KEY ("printing_id") REFERENCES "public"."printings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_logs" ADD CONSTRAINT "collection_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_printings" ADD CONSTRAINT "collection_printings_printing_id_printings_id_fk" FOREIGN KEY ("printing_id") REFERENCES "public"."printings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_printings" ADD CONSTRAINT "collection_printings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_histories" ADD CONSTRAINT "price_histories_printing_id_printings_id_fk" FOREIGN KEY ("printing_id") REFERENCES "public"."printings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printings" ADD CONSTRAINT "printings_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printings" ADD CONSTRAINT "printings_card_set_id_card_sets_id_fk" FOREIGN KEY ("card_set_id") REFERENCES "public"."card_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree (lower("email"));