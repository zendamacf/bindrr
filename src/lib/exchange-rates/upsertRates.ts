import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';

function toCurrencyRows(rates: Record<string, number>) {
  return Object.entries(rates).map(([code, rate]) => ({
    code: code.toUpperCase(),
    exchangerate: String(rate),
  }));
}

export async function upsertCurrencyRates(rates: Record<string, number>): Promise<number> {
  const rows = toCurrencyRows(rates);
  if (rows.length === 0) return 0;

  await db.transaction(async (tx) => {
    for (const row of rows) {
      const [existing] = await tx
        .select({ id: currencies.id })
        .from(currencies)
        .where(eq(currencies.code, row.code))
        .limit(1);

      if (existing) {
        await tx
          .update(currencies)
          .set({ exchangerate: row.exchangerate })
          .where(eq(currencies.id, existing.id));
      } else {
        await tx.insert(currencies).values(row);
      }
    }
  });

  return rows.length;
}
