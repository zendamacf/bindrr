import { defineConfig } from 'vitest/config';
import { integrationTestFiles, pathAlias, sharedTestEnv } from './vitest.shared';

export default defineConfig({
  resolve: {
    alias: pathAlias,
  },
  test: {
    name: 'integration',
    environment: 'node',
    include: integrationTestFiles,
    setupFiles: ['./src/test/setup.ts', './src/test/setupIntegration.ts'],
    env: sharedTestEnv,
    sequence: {
      // Integration tests share one DATABASE_URL; parallel tests in a file race on cleanup/serial ids.
      concurrent: false,
    },
    // Integration tests share one DATABASE_URL; parallel files race on inserts/cleanup.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
