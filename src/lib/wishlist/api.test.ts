import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setClientPreferredCurrency } from '@/lib/currency/clientPreference';
import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';
import { apiRoutes } from '@/routes';
import { addWishlistCard, fetchWishlist, removeWishlistCard, updateWishlistCard } from './api';

function mockFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body });
}

function withCurrencyHeader(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set(PREFERRED_CURRENCY_HEADER, 'USD');
  return { ...init, headers };
}

describe('wishlist api', () => {
  beforeEach(() => {
    setClientPreferredCurrency('USD');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchWishlist sends the page and sort values', async () => {
    const fetchMock = mockFetch({ cards: [], count: 0, total: 0 });
    vi.stubGlobal('fetch', fetchMock);

    await fetchWishlist({ page: 2, sort: 'price', sortDesc: 'desc' });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiRoutes.wishlist}?page=2&sort=price&sort_desc=desc`,
      withCurrencyHeader(undefined),
    );
  });

  it('fetchWishlist sends the filter values that are set', async () => {
    const fetchMock = mockFetch({ cards: [] });
    vi.stubGlobal('fetch', fetchMock);

    await fetchWishlist({
      page: 1,
      sort: 'name',
      sortDesc: 'asc',
      filterSearch: 'bolt',
      filterSet: '4',
      filterRarity: 'R',
      filterFinish: 'any',
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '1',
      sort: 'name',
      sort_desc: 'asc',
      filter_search: 'bolt',
      filter_set: '4',
      filter_rarity: 'R',
      filter_finish: 'any',
    });
  });

  it('fetchWishlist throws the error message of the server', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'nope' }, false));
    await expect(fetchWishlist({ page: 1, sort: 'name', sortDesc: 'asc' })).rejects.toThrow('nope');
  });

  it('fetchWishlist throws a default message', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false));
    await expect(fetchWishlist({ page: 1, sort: 'name', sortDesc: 'asc' })).rejects.toThrow(
      'Failed to load wishlist',
    );
  });

  it('addWishlistCard posts the card and returns the result', async () => {
    const fetchMock = mockFetch({ ok: true, overlapsOtherFinish: true });
    vi.stubGlobal('fetch', fetchMock);
    const params = { scryfallId: 'sid', quantity: 1, finish: 'any' as const };

    const result = await addWishlistCard(params);

    expect(result.overlapsOtherFinish).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.wishlistAdd,
      withCurrencyHeader({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params),
      }),
    );
  });

  it('addWishlistCard throws on an error response', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false));
    await expect(
      addWishlistCard({ scryfallId: 'sid', quantity: 1, finish: 'foil' }),
    ).rejects.toThrow('Failed to add card to wishlist');
  });

  it('updateWishlistCard sends a PATCH request', async () => {
    const fetchMock = mockFetch({ ok: true, removed: false });
    vi.stubGlobal('fetch', fetchMock);

    await updateWishlistCard(5, { quantity: 3, finish: 'etched' });

    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.wishlistItem(5),
      withCurrencyHeader({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity: 3, finish: 'etched' }),
      }),
    );
  });

  it('updateWishlistCard throws on an error response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not found' }, false));
    await expect(updateWishlistCard(5, { quantity: 1 })).rejects.toThrow('Not found');
  });

  it('removeWishlistCard sends a DELETE request', async () => {
    const fetchMock = mockFetch({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await removeWishlistCard(5);

    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.wishlistItem(5),
      withCurrencyHeader({ method: 'DELETE' }),
    );
  });

  it('removeWishlistCard throws on an error response', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false));
    await expect(removeWishlistCard(5)).rejects.toThrow('Failed to remove wishlist item');
  });
});
