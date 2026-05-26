import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbSelect = vi.fn();
const dbUpdate = vi.fn();
const scryfallFetchCollection = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    selectDistinct: (...args: unknown[]) => dbSelect(...args),
    update: (...args: unknown[]) => dbUpdate(...args),
  },
}));

vi.mock('@/lib/scryfall/client', () => ({
  scryfallFetchCollection: (...args: unknown[]) => scryfallFetchCollection(...args),
  scryfallPricesFromCard: (card: {
    prices?: { usd?: string; usd_foil?: string; usd_etched?: string };
  }) => ({
    price: card.prices?.usd ?? null,
    foilprice: card.prices?.usd_foil ?? null,
    etchedprice: card.prices?.usd_etched ?? null,
  }),
}));

function mockSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
  dbSelect.mockReturnValue(chain);
  return chain;
}

function mockUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  dbUpdate.mockReturnValue({ set });
  return { set, where };
}

describe('syncCollectionPrintingPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero when no collection printings have scryfall ids', async () => {
    mockSelectChain([]);

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(syncCollectionPrintingPrices()).resolves.toEqual({ updated: 0, total: 0 });
    expect(scryfallFetchCollection).not.toHaveBeenCalled();
  });

  it('fetches prices in batches and updates printings', async () => {
    mockSelectChain([{ scryfallId: 'a' }, { scryfallId: 'b' }]);
    scryfallFetchCollection.mockResolvedValue([
      { id: 'a', prices: { usd: '1.00', usd_foil: '2.00', usd_etched: null } },
      { id: 'b', prices: { usd: '0.50', usd_foil: null, usd_etched: '3.00' } },
    ]);
    mockUpdateChain();

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(syncCollectionPrintingPrices()).resolves.toEqual({ updated: 2, total: 2 });

    expect(scryfallFetchCollection).toHaveBeenCalledWith(['a', 'b']);
    expect(dbUpdate).toHaveBeenCalledTimes(2);
  });
});
