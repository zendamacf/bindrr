'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/fetch';
import { collectionKeys } from '@/lib/collection/query-keys';
import {
  readClientPreferredCurrency,
  setClientPreferredCurrency,
} from '@/lib/currency/clientPreference';
import {
  normalizeCurrencyCode,
  SUPPORTED_CURRENCIES,
  type SupportedCurrencyCode,
} from '@/lib/currency/supported';
import { apiRoutes } from '@/routes';

type CurrencyPreferencesResponse = {
  preferredCurrencyCode: SupportedCurrencyCode;
  currencies: typeof SUPPORTED_CURRENCIES;
};

type CurrencyContextValue = {
  currencyCode: SupportedCurrencyCode;
  currencies: typeof SUPPORTED_CURRENCIES;
  isLoading: boolean;
  setCurrencyCode: (code: SupportedCurrencyCode) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

async function fetchCurrencyPreferences(): Promise<CurrencyPreferencesResponse> {
  const res = await apiFetch(apiRoutes.userPreferences);
  const body = (await res.json()) as CurrencyPreferencesResponse & { error?: string };
  if (!res.ok) {
    console.error(await res.json());
    throw new Error(body.error ?? 'Failed to load currency preferences');
  }
  return {
    preferredCurrencyCode: normalizeCurrencyCode(body.preferredCurrencyCode),
    currencies: body.currencies ?? SUPPORTED_CURRENCIES,
  };
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currencyCode, setCurrencyCodeState] = useState<SupportedCurrencyCode>(
    readClientPreferredCurrency,
  );

  const preferencesQuery = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: fetchCurrencyPreferences,
  });

  useEffect(() => {
    const code = preferencesQuery.data?.preferredCurrencyCode;
    if (!code) return;
    setCurrencyCodeState(code);
    setClientPreferredCurrency(code);
  }, [preferencesQuery.data?.preferredCurrencyCode]);

  const setCurrencyCode = useCallback(
    async (code: SupportedCurrencyCode) => {
      setCurrencyCodeState(code);
      setClientPreferredCurrency(code);

      const res = await apiFetch(apiRoutes.userPreferences, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferredCurrencyCode: code }),
      });
      const body = (await res.json()) as { preferredCurrencyCode?: string; error?: string };
      if (!res.ok) {
        console.error(await res.json());
        throw new Error(body.error ?? 'Failed to update currency');
      }

      const saved = normalizeCurrencyCode(body.preferredCurrencyCode);
      setCurrencyCodeState(saved);
      setClientPreferredCurrency(saved);

      await queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['cardSearch'] });
      await queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({
      currencyCode,
      currencies: preferencesQuery.data?.currencies ?? SUPPORTED_CURRENCIES,
      isLoading: preferencesQuery.isPending,
      setCurrencyCode,
    }),
    [currencyCode, preferencesQuery.data?.currencies, preferencesQuery.isPending, setCurrencyCode],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}
