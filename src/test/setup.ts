import { vi } from 'vitest';
import { loadEnvFile } from './loadEnvFile';

vi.mock('server-only', () => ({}));

vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: () => Promise<T>) => fn,
  revalidateTag: vi.fn(),
}));

const TEST_ENV_FILE = '.env.test';

loadEnvFile(TEST_ENV_FILE);

const isIntegrationProject = process.env.VITEST_PROJECT_NAME === 'integration';

if (isIntegrationProject && !process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is required for integration tests. Copy .env.test.example to ${TEST_ENV_FILE} and point it at a dedicated test database.`,
  );
}
