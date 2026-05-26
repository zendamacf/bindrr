CREATE TABLE "price_sync_state" (
	"job" text PRIMARY KEY NOT NULL,
	"scryfall_ids" text[] NOT NULL,
	"next_index" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
