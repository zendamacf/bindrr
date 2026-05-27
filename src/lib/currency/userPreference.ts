import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  isSupportedCurrencyCode,
  normalizeCurrencyCode,
  type SupportedCurrencyCode,
} from './supported';

export async function getUserPreferredCurrency(userId: number): Promise<SupportedCurrencyCode> {
  const [row] = await db
    .select({ preferredCurrencyCode: users.preferredCurrencyCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return normalizeCurrencyCode(row?.preferredCurrencyCode);
}

export async function setUserPreferredCurrency(
  userId: number,
  currencyCode: string,
): Promise<SupportedCurrencyCode> {
  if (!isSupportedCurrencyCode(currencyCode)) {
    throw new Error('Unsupported currency');
  }

  const normalized = currencyCode.toUpperCase() as SupportedCurrencyCode;

  await db.update(users).set({ preferredCurrencyCode: normalized }).where(eq(users.id, userId));

  return normalized;
}
