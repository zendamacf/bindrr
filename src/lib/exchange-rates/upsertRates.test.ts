import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';
import { upsertCurrencyRates } from './upsertRates';

const TEST_CODES = ['ZZZ', 'ZZY'];

describe('upsertCurrencyRates', () => {
  beforeEach(async () => {
    await db.delete(currencies).where(eq(currencies.code, TEST_CODES[0]));
    await db.delete(currencies).where(eq(currencies.code, TEST_CODES[1]));
  });

  afterEach(async () => {
    await db.delete(currencies).where(eq(currencies.code, TEST_CODES[0]));
    await db.delete(currencies).where(eq(currencies.code, TEST_CODES[1]));
  });

  it('inserts new currencies and updates existing rows', async () => {
    const first = await upsertCurrencyRates({ zzz: 1.1, zzy: 2.2 });
    expect(first).toBe(2);

    const second = await upsertCurrencyRates({ ZZZ: 3.3, ZZY: 4.4 });
    expect(second).toBe(2);

    const rows = await db.select().from(currencies).where(eq(currencies.code, 'ZZZ'));

    expect(rows[0]?.exchangerate).toBe('3.3');
  });
});
