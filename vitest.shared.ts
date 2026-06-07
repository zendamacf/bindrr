import path from 'node:path';

/** DB integration tests share one DATABASE_URL and must run serially. */
export const integrationTestFiles = [
  'src/lib/collection/getCollection.test.ts',
  'src/lib/collection/updateCollectionItem.test.ts',
  'src/lib/collection/getPrintingPriceHistory.test.ts',
  'src/lib/collection/getPriceTrendsForPrintings.test.ts',
  'src/lib/collection/addToCollection.test.ts',
  'src/lib/collection/getCollectionItem.test.ts',
  'src/lib/collection/ensureCardSet.test.ts',
  'src/actions/auth/actions.test.ts',
  'src/lib/cache/cardSets.test.ts',
  'src/lib/cache/exchangeRates.test.ts',
  'src/lib/currency/convert.test.ts',
  'src/lib/exchange-rates/upsertRates.test.ts',
];

export const sharedTestEnv = {
  AUTH_SECRET: 'test-auth-secret-at-least-32-chars-long',
};

export const coverageConfig = {
  provider: 'v8' as const,
  reporter: ['text', 'json-summary', 'json', 'lcov'],
  reportsDirectory: './coverage',
  // Measured against server/lib code imported by tests (not React UI or raw DB schema).
  exclude: [
    '**/*.test.ts',
    'src/lib/db/**',
    'src/lib/scryfall/client.ts',
    'src/lib/exchange-rates/updateExchangeRates.ts',
  ],
  thresholds: {
    lines: 90,
    functions: 95,
    branches: 72,
    statements: 88,
  },
};

export const pathAlias = {
  '@': path.resolve(__dirname, './src'),
};
