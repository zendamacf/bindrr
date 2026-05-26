import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadEnvFile } from './loadEnvFile';

const TEMP_ENV = resolve(process.cwd(), '.env.test.tmp');

describe('loadEnvFile', () => {
  afterEach(() => {
    if (existsSync(TEMP_ENV)) unlinkSync(TEMP_ENV);
    delete process.env.TEST_LOAD_ENV_VAR;
  });

  it('returns false when the file does not exist', () => {
    expect(loadEnvFile('.env.test.does-not-exist')).toBe(false);
  });

  it('loads variables without overriding existing env by default', () => {
    writeFileSync(TEMP_ENV, 'TEST_LOAD_ENV_VAR=from-file\nDATABASE_URL=from-file\n');
    process.env.TEST_LOAD_ENV_VAR = 'from-env';
    process.env.DATABASE_URL = 'from-ci';

    expect(loadEnvFile('.env.test.tmp')).toBe(true);
    expect(process.env.TEST_LOAD_ENV_VAR).toBe('from-env');
    expect(process.env.DATABASE_URL).toBe('from-ci');
  });

  it('can override existing variables when requested', () => {
    writeFileSync(TEMP_ENV, 'TEST_LOAD_ENV_VAR=overridden\n');
    process.env.TEST_LOAD_ENV_VAR = 'original';

    loadEnvFile('.env.test.tmp', { override: true });

    expect(process.env.TEST_LOAD_ENV_VAR).toBe('overridden');
  });
});
