import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const getUserPreferredCurrency = vi.fn();
const setUserPreferredCurrency = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/currency/userPreference', () => ({
  getUserPreferredCurrency,
  setUserPreferredCurrency,
}));

describe('/api/user/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET returns preferred currency and options', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getUserPreferredCurrency.mockResolvedValue('EUR');

    const { GET } = await import('./route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferredCurrencyCode).toBe('EUR');
    expect(body.currencies).toEqual(expect.arrayContaining([{ code: 'USD', label: 'US Dollar' }]));
  });

  it('PATCH updates preferred currency', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    setUserPreferredCurrency.mockResolvedValue('GBP');

    const { PATCH } = await import('./route');
    const response = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferredCurrencyCode: 'GBP' }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ preferredCurrencyCode: 'GBP' });
    expect(setUserPreferredCurrency).toHaveBeenCalledWith(1, 'GBP');
  });

  it('PATCH returns 400 for unsupported currency', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    setUserPreferredCurrency.mockRejectedValue(new Error('Unsupported currency'));

    const { PATCH } = await import('./route');
    const response = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferredCurrencyCode: 'XXX' }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
