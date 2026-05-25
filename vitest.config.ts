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
    env: {
      AUTH_SECRET: 'test-auth-secret-at-least-32-chars-long',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/auth/password.ts',
        'src/utils/auth/session.ts',
        'src/utils/auth/session-token.ts',
        'src/utils/auth/guardUser.ts',
        'src/actions/auth/actions.ts',
      ],
      exclude: ['**/*.test.ts', 'src/lib/db/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
