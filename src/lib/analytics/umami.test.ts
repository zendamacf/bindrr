import { describe, expect, it } from 'vitest';
import { getUmamiConfig } from './umami';

describe('getUmamiConfig', () => {
  it('returns null when either env var is missing', () => {
    expect(getUmamiConfig({})).toBeNull();
    expect(getUmamiConfig({ PUBLIC_UMAMI_WEBSITE_ID: 'site-id' })).toBeNull();
    expect(
      getUmamiConfig({ PUBLIC_UMAMI_SCRIPT_URL: 'https://umami.example/script.js' }),
    ).toBeNull();
  });

  it('returns null for blank or invalid script URLs', () => {
    expect(
      getUmamiConfig({
        PUBLIC_UMAMI_WEBSITE_ID: 'site-id',
        PUBLIC_UMAMI_SCRIPT_URL: '   ',
      }),
    ).toBeNull();
    expect(
      getUmamiConfig({
        PUBLIC_UMAMI_WEBSITE_ID: 'site-id',
        PUBLIC_UMAMI_SCRIPT_URL: 'not-a-url',
      }),
    ).toBeNull();
    expect(
      getUmamiConfig({
        PUBLIC_UMAMI_WEBSITE_ID: 'site-id',
        PUBLIC_UMAMI_SCRIPT_URL: 'javascript:alert(1)',
      }),
    ).toBeNull();
  });

  it('returns config for http(s) script URLs', () => {
    expect(
      getUmamiConfig({
        PUBLIC_UMAMI_WEBSITE_ID: '  abc-123  ',
        PUBLIC_UMAMI_SCRIPT_URL: ' https://umami.example.com/script.js ',
      }),
    ).toEqual({
      websiteId: 'abc-123',
      scriptUrl: 'https://umami.example.com/script.js',
    });
  });
});
