import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setClientPreferredCurrency } from '@/lib/currency/clientPreference';
import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';
import { apiRoutes, collectionApiUrl } from '@/routes';
import {
  addCollectionCard,
  fetchCardSets,
  fetchCollection,
  fetchCollectionItem,
  fetchCollectionItemScryfall,
  removeCollectionItem,
  searchCards,
  updateCollectionItem,
  updateCollectionItemQuantity,
} from './api';

function mockFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
}

function withCurrencyHeader(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set(PREFERRED_CURRENCY_HEADER, 'USD');
  return { ...init, headers };
}

describe('collection api', () => {
  beforeEach(() => {
    setClientPreferredCurrency('USD');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchCardSets requests the sets endpoint with the currency header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sets: [
          { id: 1, name: 'Alpha', code: 'LEA', symbolSvgUri: 'https://example.com/alpha.svg' },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sets = await fetchCardSets();

    expect(fetchMock).toHaveBeenCalledWith(apiRoutes.collectionSets, withCurrencyHeader());
    expect(sets).toEqual([
      { id: 1, name: 'Alpha', code: 'LEA', symbolSvgUri: 'https://example.com/alpha.svg' },
    ]);
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
      withCurrencyHeader(),
    );
  });

  it('searchCards requests the search endpoint with the currency header', async () => {
    const fetchMock = mockFetch({ results: [{ scryfallId: 'x', name: 'Bolt' }] });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchCards('bolt', 'en');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cards/search?query=bolt&lang=en',
      withCurrencyHeader(),
    );
    expect(results).toEqual([{ scryfallId: 'x', name: 'Bolt' }]);
  });

  it('addCollectionCard posts to the add endpoint', async () => {
    const fetchMock = mockFetch({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await addCollectionCard({ scryfallId: 'id', quantity: 2, finish: 'foil' });

    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.collectionAdd,
      withCurrencyHeader({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scryfallId: 'id', quantity: 2, finish: 'foil' }),
      }),
    );
  });

  it('fetchCollectionItem returns the item payload', async () => {
    const item = { collectionPrintingId: 1, name: 'Bolt', history: [] };
    const fetchMock = mockFetch({ item });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCollectionItem(1)).resolves.toEqual(item);
    expect(fetchMock).toHaveBeenCalledWith(apiRoutes.collectionItem(1), withCurrencyHeader());
  });

  it('fetchCollectionItemScryfall returns extended details', async () => {
    const details = { oracleText: 'Deal 3 damage.' };
    vi.stubGlobal('fetch', mockFetch({ details }));

    await expect(fetchCollectionItemScryfall(4)).resolves.toEqual(details);
  });

  it('updateCollectionItem patches quantity and finish', async () => {
    const fetchMock = mockFetch({ ok: true, removed: false, collectionPrintingId: 2 });
    vi.stubGlobal('fetch', fetchMock);

    await updateCollectionItem(2, { quantity: 3, finish: 'etched' });

    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.collectionItem(2),
      withCurrencyHeader({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity: 3, finish: 'etched' }),
      }),
    );
  });

  it('updateCollectionItemQuantity delegates to updateCollectionItem', async () => {
    const fetchMock = mockFetch({ ok: true, removed: false });
    vi.stubGlobal('fetch', fetchMock);

    await updateCollectionItemQuantity(9, 1);

    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.collectionItem(9),
      expect.objectContaining({
        body: JSON.stringify({ quantity: 1 }),
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get(PREFERRED_CURRENCY_HEADER)).toBe('USD');
  });

  it('removeCollectionItem deletes the collection row', async () => {
    const fetchMock = mockFetch({ ok: true, removed: true });
    vi.stubGlobal('fetch', fetchMock);

    await removeCollectionItem(5);

    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.collectionItem(5),
      withCurrencyHeader({ method: 'DELETE' }),
    );
  });

  it('uses a default error message when the API omits one', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false));

    await expect(fetchCardSets()).rejects.toThrow('Failed to load sets');
  });

  it('throws when fetchCollectionItem returns no item', async () => {
    vi.stubGlobal('fetch', mockFetch({}));

    await expect(fetchCollectionItem(1)).rejects.toThrow('Failed to load card');
  });

  it('throws when fetchCollectionItemScryfall returns no details', async () => {
    vi.stubGlobal('fetch', mockFetch({}));

    await expect(fetchCollectionItemScryfall(1)).rejects.toThrow('Failed to load card details');
  });
});
