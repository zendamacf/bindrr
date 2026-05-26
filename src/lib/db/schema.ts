import { type SQL, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: serial().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_email_unique_idx').on(lower(table.email))],
);

export const card_sets = pgTable('card_sets', {
  id: serial().primaryKey(),
  name: text().notNull(),
  code: text().notNull(),
  released: date().notNull(),
  symbol_svg_uri: text(),
  tcgplayer_groupid: integer(),
});

export const cards = pgTable('cards', {
  id: serial().primaryKey(),
  name: text().notNull(),
  colors: text(),
  multifaced: boolean().notNull().default(false),
  cmc: numeric(),
  typeline: text(),
  manacost: text(),
});

export const printings = pgTable('printings', {
  id: serial().primaryKey(),
  card_id: integer()
    .notNull()
    .references(() => cards.id),
  collectornumber: text().notNull(),
  card_set_id: integer()
    .notNull()
    .references(() => card_sets.id),
  multiverse_id: integer(),
  /** Denormalized latest USD prices for fast collection list/sort/aggregate queries. */
  price: numeric(),
  foilprice: numeric(),
  etchedprice: numeric(),
  tcgplayer_productid: text(),
  scryfall_id: text().unique(),
  rarity: varchar({ length: 1 }),
  language: text(),
  pricesUpdatedAt: timestamp('prices_updated_at'),
});

/** One row per printing per UTC day; source of truth for price trends. */
export const printing_price_history = pgTable(
  'printing_price_history',
  {
    id: serial().primaryKey(),
    printingId: integer('printing_id')
      .notNull()
      .references(() => printings.id, { onDelete: 'cascade' }),
    recordedOn: date('recorded_on').notNull(),
    price: numeric(),
    foilprice: numeric(),
    etchedprice: numeric(),
  },
  (table) => [
    uniqueIndex('printing_price_history_printing_recorded_on_unique').on(
      table.printingId,
      table.recordedOn,
    ),
  ],
);

export const collection_printings = pgTable(
  'collection_printings',
  {
    id: serial().primaryKey(),
    printing_id: integer()
      .notNull()
      .references(() => printings.id),
    user_id: integer()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    quantity: integer().notNull(),
    foil: boolean().notNull().default(false),
    etched: boolean().notNull().default(false),
  },
  (table) => [
    uniqueIndex('collection_printings_unique_idx').on(
      table.user_id,
      table.printing_id,
      table.foil,
      table.etched,
    ),
  ],
);

export const collection_logs = pgTable('collection_logs', {
  id: serial().primaryKey(),
  printing_id: integer()
    .notNull()
    .references(() => printings.id, { onDelete: 'cascade' }),
  user_id: integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  change: integer().notNull(),
  foil: boolean().notNull().default(false),
  etched: boolean().notNull().default(false),
  occurred: timestamp().notNull().defaultNow(),
});

export const currencies = pgTable(
  'currencies',
  {
    id: serial().primaryKey(),
    code: text().notNull(),
    exchangerate: numeric().notNull(),
  },
  (table) => [uniqueIndex('currencies_code_unique_idx').on(table.code)],
);

/** Checkpoint for resumable cron jobs (e.g. collection price sync). */
export const price_sync_state = pgTable('price_sync_state', {
  job: text('job').primaryKey(),
  scryfallIds: text('scryfall_ids').array().notNull(),
  nextIndex: integer('next_index').notNull().default(0),
  updatedCount: integer('updated_count').notNull().default(0),
  startedAt: timestamp('started_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  /** Set when a full pass finishes; used to skip further runs until the next UTC day. */
  completedAt: timestamp('completed_at'),
});

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
