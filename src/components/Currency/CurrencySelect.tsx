'use client';

import { Select } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { SupportedCurrencyCode } from '@/lib/currency/supported';
import { useCurrency } from './CurrencyProvider';

export function CurrencySelect() {
  const { currencyCode, currencies, isLoading, setCurrencyCode } = useCurrency();
  const isMobile = useMediaQuery('(max-width: 48.75rem)', true);

  return (
    <Select
      aria-label="Preferred currency"
      data={currencies.map((c) => ({
        value: c.code,
        label: isMobile ? c.code : c.label,
      }))}
      renderOption={({ option }) =>
        currencies.find((c) => c.code === option.value)?.label ?? option.label
      }
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
      w={isMobile ? 72 : 200}
      size={isMobile ? 'xs' : 'sm'}
      withScrollArea={false}
      comboboxProps={{ withinPortal: true }}
    />
  );
}
