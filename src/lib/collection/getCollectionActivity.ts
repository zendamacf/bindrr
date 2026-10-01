import { and, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { card_sets, cards, collection_logs, printings } from '@/lib/db/schema';
import { COLLECTION_PAGE_SIZE, pageCount } from './helpers';
import type { GetCollectionActivityParams, GetCollectionActivityResult } from './types';

function buildWhere(userId: number, params: GetCollectionActivityParams) {
  const conditions = [eq(collection_logs.user_id, userId)];

  if (params.filterSearch?.trim()) {
    conditions.push(ilike(cards.name, `%${params.filterSearch.trim()}%`));
  }
  if (params.filterSet != null) {
    conditions.push(eq(printings.card_set_id, params.filterSet));
  }
  if (params.filterFrom) {
    const from = new Date(params.filterFrom);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(gte(collection_logs.occurred, from));
    }
  }
  if (params.filterTo) {
    const to = new Date(params.filterTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      conditions.push(lte(collection_logs.occurred, to));
    }
  }

  return and(...conditions);
}

export async function getCollectionActivity(
  params: GetCollectionActivityParams,
): Promise<GetCollectionActivityResult> {
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * COLLECTION_PAGE_SIZE;
  const where = buildWhere(params.userId, params);

  const [aggregate] = await db
    .select({ rowCount: sql<number>`count(*)::int` })
    .from(collection_logs)
    .innerJoin(printings, eq(collection_logs.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .where(where);

  const rows = await db
    .select({
      id: collection_logs.id,
      change: collection_logs.change,
      occurred: collection_logs.occurred,
      foil: collection_logs.foil,
      etched: collection_logs.etched,
      cardName: cards.name,
      setName: card_sets.name,
      setCode: card_sets.code,
      collectorNumber: printings.collectornumber,
    })
    .from(collection_logs)
    .innerJoin(printings, eq(collection_logs.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .innerJoin(card_sets, eq(printings.card_set_id, card_sets.id))
    .where(where)
    .orderBy(desc(collection_logs.occurred), desc(collection_logs.id))
    .limit(COLLECTION_PAGE_SIZE)
    .offset(offset);

  const total = aggregate?.rowCount ?? 0;

  return {
    entries: rows.map((row) => ({
      id: row.id,
      change: row.change,
      occurred: row.occurred.toISOString(),
      foil: row.foil,
      etched: row.etched,
      cardName: row.cardName,
      setName: row.setName,
      setCode: row.setCode,
      collectorNumber: row.collectorNumber,
    })),
    count: pageCount(total, COLLECTION_PAGE_SIZE),
    total,
  };
}
