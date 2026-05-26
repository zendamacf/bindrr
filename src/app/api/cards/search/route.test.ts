import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  }),
}));

function request(url: string) {
  return new Request(`http://localhost${url}`);
}

describe('GET /api/cards/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const response = await GET(request(`${apiRoutes.cardSearch}?query=bolt`));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          scryfallId: 's1',
          name: 'Lightning Bolt',
          setName: 'Magic 2010',
          setCode: 'M10',
          collectorNumber: '146',
          language: null,
          imageUrl: 'https://img.test/card.jpg',
          priceUsd: '1.23',
          priceUsdFoil: '4.56',
          tcgplayerProductId: '123',
          canAddNonfoil: true,
          canAddFoil: true,
        },
      ],
    });
  });
});
