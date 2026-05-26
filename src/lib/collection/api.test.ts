import { describe, expect, it, vi } from 'vitest';
import { apiRoutes, collectionApiUrl } from '@/routes';
import { fetchCardSets, fetchCollection } from './api';

describe('collection api', () => {
  it('fetchCardSets requests the sets endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sets: [{ id: 1, name: 'Alpha', code: 'LEA' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sets = await fetchCardSets();

    expect(fetchMock).toHaveBeenCalledWith(apiRoutes.collectionSets);
    expect(sets).toEqual([{ id: 1, name: 'Alpha', code: 'LEA' }]);
  });

  it('fetchCollection throws when the API returns an error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCollection({ page: 1, sort: 'name', sortDesc: 'asc' })).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('fetchCollection builds query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cards: [], count: 0, total: 0, totalPrice: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchCollection({
      page: 2,
      sort: 'quantity',
      sortDesc: 'desc',
      filterSearch: 'bolt',
      filterSet: '3',
      filterRarity: 'R',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      collectionApiUrl(
        new URLSearchParams({
          page: '2',
          sort: 'quantity',
          sort_desc: 'desc',
          filter_search: 'bolt',
          filter_set: '3',
          filter_rarity: 'R',
        }),
      ),
    );
  });
});
