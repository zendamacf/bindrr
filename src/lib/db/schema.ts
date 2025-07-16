import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';

export const card_sets = pgTable('card_sets', {
  id: serial().primaryKey(),
  name: text().notNull(),
  code: text().notNull(),
  released: date().notNull(),
  tcgplayer_groupid: integer(),
});

export const card_types = pgTable('card_types', {
  id: serial().primaryKey(),
  name: text().notNull(),
});

export const cards = pgTable('cards', {
  id: serial().primaryKey(),
  name: text().notNull(),
  colors: text(),
  multifaced: boolean().notNull().default(false),
  cmc: numeric(),
  typeline: text(),
  manacost: text(),
  card_type_id: integer().references(() => card_types.id, { onDelete: 'set null' }),
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
  price: numeric(),
  foilprice: numeric(),
  tcgplayer_productid: text(),
  scryfall_id: text().unique(),
  rarity: varchar({ length: 1 }),
  language: text(),
});

export const collection_printings = pgTable('collection_printings', {
  id: serial().primaryKey(),
  printing_id: integer()
    .notNull()
    .references(() => printings.id),
  user_id: uuid()
    .notNull()
    .references(() => authUsers.id, { onDelete: 'restrict' }),
  quantity: integer().notNull(),
  foil: boolean().notNull().default(false),
});

export const collection_logs = pgTable('collection_logs', {
  id: serial().primaryKey(),
  printing_id: integer()
    .notNull()
    .references(() => printings.id, { onDelete: 'cascade' }),
  user_id: uuid()
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  change: integer().notNull(),
  foil: boolean().notNull().default(false),
  occurred: timestamp().notNull().defaultNow(),
});

export const currencies = pgTable('currencies', {
  id: serial().primaryKey(),
  code: text().notNull(),
  exchangerate: numeric().notNull(),
});

export const price_histories = pgTable('price_histories', {
  id: serial().primaryKey(),
  printing_id: integer()
    .notNull()
    .references(() => printings.id, { onDelete: 'cascade' }),
  price: numeric(),
  foilprice: numeric(),
  pricetype: text(),
  created: date().notNull().defaultNow().unique(),
});
