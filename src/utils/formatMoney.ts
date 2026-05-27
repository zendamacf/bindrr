export type FormatMoneyOptions = {
  locale?: string;
};

export function formatMoney(
  amount: number | null,
  currency: string,
  options: FormatMoneyOptions = {},
): string | null {
  if (amount == null) return null;
  if (!Number.isFinite(amount)) return null;

  try {
    const formatter = new Intl.NumberFormat(options.locale, {
      style: 'currency',
      currency,
    });
    return formatter.format(amount);
  } catch {
    // If currency is invalid/unsupported, fall back to a stable display.
    return `${amount.toFixed(2)} ${currency}`;
  }
}
