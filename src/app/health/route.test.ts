import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /health', () => {
  it('returns ok', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });
});
