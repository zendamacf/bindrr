import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { card_sets } from '@/lib/db/schema';

export async function getCardSets() {
  return db
    .select({
      id: card_sets.id,
      name: card_sets.name,
      code: card_sets.code,
    })
    .from(card_sets)
    .orderBy(desc(card_sets.released));
}
