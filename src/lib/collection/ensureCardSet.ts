import { eq } from 'drizzle-orm';
import { invalidateCardSetsCache } from '@/lib/cache/invalidateCardSets';
import { getScryfallSetByCodeCached } from '@/lib/cache/scryfallSet';
import type { db } from '@/lib/db';
import { card_sets } from '@/lib/db/schema';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function ensureCardSet(
  tx: DbTransaction,
  params: { code: string; name: string; released: string },
): Promise<number> {
  const code = params.code.toUpperCase();

  const [existing] = await tx
    .select({
      id: card_sets.id,
      symbolSvgUri: card_sets.symbol_svg_uri,
    })
    .from(card_sets)
    .where(eq(card_sets.code, code))
    .limit(1);

  if (existing) {
    if (!existing.symbolSvgUri) {
      const scryfallSet = await getScryfallSetByCodeCached(code);
      if (scryfallSet.icon_svg_uri) {
        await tx
          .update(card_sets)
          .set({ symbol_svg_uri: scryfallSet.icon_svg_uri })
          .where(eq(card_sets.id, existing.id));
      }
    }
    return existing.id;
  }

  const scryfallSet = await getScryfallSetByCodeCached(code);
  const [inserted] = await tx
    .insert(card_sets)
    .values({
      code,
      name: params.name,
      released: params.released,
      symbol_svg_uri: scryfallSet.icon_svg_uri ?? null,
    })
    .returning({ id: card_sets.id });

  invalidateCardSetsCache();

  return inserted.id;
}
