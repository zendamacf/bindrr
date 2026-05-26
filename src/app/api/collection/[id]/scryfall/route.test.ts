import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const getCollectionItem = vi.fn();
const scryfallGetCardById = vi.fn();
const mapScryfallExtendedDetails = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollectionItem', () => ({ getCollectionItem }));
vi.mock('@/lib/scryfall/client', () => ({ scryfallGetCardById }));
vi.mock('@/lib/scryfall/extendedDetails', () => ({ mapScryfallExtendedDetails }));

describe('GET /api/collection/[id]/scryfall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/1/scryfall'), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns mapped Scryfall details for an owned card', async () => {
    getSession.mockResolvedValue({ id: 2, email: 'a@b.com' });
    getCollectionItem.mockResolvedValue({ scryfallId: 'sf-1' });
    scryfallGetCardById.mockResolvedValue({ id: 'sf-1', name: 'Bolt' });
    mapScryfallExtendedDetails.mockReturnValue({ typeLine: 'Instant' });

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5/scryfall'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(200);
    expect(getCollectionItem).toHaveBeenCalledWith(2, 5);
    expect(scryfallGetCardById).toHaveBeenCalledWith('sf-1');
    await expect(response.json()).resolves.toEqual({ details: { typeLine: 'Instant' } });
  });

  it('returns 404 when the printing has no Scryfall id', async () => {
    getSession.mockResolvedValue({ id: 2, email: 'a@b.com' });
    getCollectionItem.mockResolvedValue({ scryfallId: null });

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5/scryfall'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(404);
    expect(scryfallGetCardById).not.toHaveBeenCalled();
  });
});

function request(url: string) {
  return new Request(`http://localhost${url}`);
}
