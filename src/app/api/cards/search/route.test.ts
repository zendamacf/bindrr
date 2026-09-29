import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit/store';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const scryfallSearchPrints = vi.fn();
const scryfallImageUrl = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/scryfall/client', () => ({
  scryfallSearchPrints,
  scryfallImageUrl,
  scryfallFinishAvailability: (finishes: string[] | undefined) => ({
    canAddNonfoil: finishes?.includes('nonfoil') ?? true,
    canAddFoil: finishes?.includes('foil') ?? true,
    canAddEtched: finishes?.includes('etched') ?? true,
  }),
}));

function request(url: string) {
  return new Request(`http://localhost${url}`);
}

describe('GET /api/cards/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  afterEach(() => {
    resetRateLimitStore();
    vi.unstubAllEnvs();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.cardSearch));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns empty results for short query', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const { GET } = await import('./route');
    const response = await GET(request(`${apiRoutes.cardSearch}?query=ab`));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ results: [] });
    expect(scryfallSearchPrints).not.toHaveBeenCalled();
  });

  it('maps scryfall results', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    scryfallImageUrl.mockReturnValue('https://img.test/card.jpg');
    scryfallSearchPrints.mockResolvedValue([
      {
        id: 's1',
        name: 'Lightning Bolt',
        set: 'm10',
        set_name: 'Magic 2010',
        collector_number: '146',
        lang: 'en',
        finishes: ['nonfoil', 'foil'],
        prices: { usd: '1.23', usd_foil: '4.56' },
        tcgplayer_id: 123,
      },
    ]);

    const { GET } = await import('./route');
    const response = await GET(request(`${apiRoutes.cardSearch}?query=bolt&lang=en`));

    expect(scryfallSearchPrints).toHaveBeenCalledWith('bolt', { lang: 'en' });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          scryfallId: 's1',
          name: 'Lightning Bolt',
          setName: 'Magic 2010',
          setCode: 'M10',
          collectorNumber: '146',
          languageCode: 'en',
          imageUrl: 'https://img.test/card.jpg',
          price: 1.23,
          priceFoil: 4.56,
          priceEtched: null,
          currencyCode: 'USD',
          tcgplayerProductId: '123',
          canAddNonfoil: true,
          canAddFoil: true,
          canAddEtched: false,
        },
      ],
    });
  });

  it('defaults to English when lang is omitted', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    scryfallSearchPrints.mockResolvedValue([]);

    const { GET } = await import('./route');
    await GET(request(`${apiRoutes.cardSearch}?query=bolt`));

    expect(scryfallSearchPrints).toHaveBeenCalledWith('bolt', { lang: 'en' });
  });

  it('returns 400 for an unsupported language', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const { GET } = await import('./route');
    const response = await GET(request(`${apiRoutes.cardSearch}?query=bolt&lang=xx`));

    expect(response.status).toBe(400);
    expect(scryfallSearchPrints).not.toHaveBeenCalled();
  });

  it('returns 429 when the search rate limit is exceeded', async () => {
    vi.stubEnv('RATE_LIMIT_SEARCH_MAX', '1');
    vi.stubEnv('RATE_LIMIT_SEARCH_WINDOW_MS', '60000');
    getSession.mockResolvedValue({ id: 99, email: 'a@b.com' });

    const { GET } = await import('./route');
    const first = await GET(request(`${apiRoutes.cardSearch}?query=bolt`));
    const second = await GET(request(`${apiRoutes.cardSearch}?query=lightning`));

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toMatchObject({
      error: 'Too many requests. Please try again later.',
    });
  });
});
