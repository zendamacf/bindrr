'use client';

import { Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { SupportedCurrencyCode } from '@/lib/currency/supported';
import { useCurrency } from './CurrencyProvider';

export function CurrencySelect() {
  const { currencyCode, currencies, isLoading, setCurrencyCode } = useCurrency();

  return (
    <Select
      aria-label="Preferred currency"
      data={currencies.map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.label}`,
      }))}
      value={currencyCode}
      disabled={isLoading}
      onChange={(value) => {
        if (!value) return;
        void setCurrencyCode(value as SupportedCurrencyCode).catch((error: unknown) => {
          notifications.show({
            color: 'red',
            title: 'Currency',
            message: error instanceof Error ? error.message : 'Failed to update currency',
          });
        });
      }}
      w={200}
      comboboxProps={{ withinPortal: true }}
    />
  );
}
