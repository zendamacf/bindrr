import { defineConfig } from 'vitest/config';
import { integrationTestFiles, pathAlias, sharedTestEnv } from './vitest.shared';

export default defineConfig({
  resolve: {
    alias: pathAlias,
  },
  test: {
    name: 'unit',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: integrationTestFiles,
    setupFiles: ['./src/test/setup.ts'],
    env: sharedTestEnv,
    fileParallelism: true,
    testTimeout: 30_000,
  },
});
