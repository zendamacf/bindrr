export function formatMoney(amount: number | null, currency: string): string | null {
  if (amount == null) return null;
  return `${amount.toFixed(2)} ${currency}`;
}
