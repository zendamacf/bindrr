import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      AUTH_SECRET: 'test-auth-secret-at-least-32-chars-long',
    },
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
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
    },
  },
});
