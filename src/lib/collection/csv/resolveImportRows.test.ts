import { describe, expect, it, vi } from 'vitest';
import type { ScryfallCard } from '@/lib/scryfall/client';
import type { ImportRow } from './parseImportRows';
import {
  type DbPrintingMatch,
  lookupKeyForRow,
  type ResolveDeps,
  resolveImportRows,
} from './resolveImportRows';

function row(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    line: 2,
    set: 'lea',
    collectorNumber: '232',
    language: 'en',
    finish: 'nonfoil',
    quantity: 1,
    scryfallId: null,
    ...overrides,
  };
}

function card(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: '0000579f-7b35-4ed3-b44c-db2a538066fe',
    name: 'Sol Ring',
    set: 'lea',
    set_name: 'Alpha',
    collector_number: '232',
    lang: 'en',
    finishes: ['nonfoil'],
    ...overrides,
  };
}

function stored(overrides: Partial<DbPrintingMatch> = {}): DbPrintingMatch {
  return {
    printingId: 7,
    scryfallId: '0000579f-7b35-4ed3-b44c-db2a538066fe',
    name: 'Sol Ring',
    setCode: 'LEA',
    collectorNumber: '232',
    language: 'en',
    price: '100',
    foilprice: null,
    etchedprice: null,
    ...overrides,
  };
}

function deps(overrides: Partial<ResolveDeps> = {}): ResolveDeps {
  return {
    findStoredPrintings: vi.fn().mockResolvedValue(new Map()),
    fetchByIdentifiers: vi.fn().mockResolvedValue([]),
    fetchBySetNumberLang: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('resolveImportRows', () => {
  it('uses stored printings and does not call Scryfall', async () => {
    const r = row();
    const d = deps({
      findStoredPrintings: vi.fn().mockResolvedValue(new Map([[lookupKeyForRow(r), stored()]])),
    });

    const [result] = await resolveImportRows([r], d);

    expect(result).toMatchObject({ printing: { printingId: 7, name: 'Sol Ring' } });
    expect(d.fetchByIdentifiers).not.toHaveBeenCalled();
  });

  it('asks Scryfall for printings that are not stored, one time for each unique printing', async () => {
    const d = deps({ fetchByIdentifiers: vi.fn().mockResolvedValue([card()]) });

    const results = await resolveImportRows([row({ line: 2 }), row({ line: 3 })], d);

    expect(d.fetchByIdentifiers).toHaveBeenCalledTimes(1);
    expect(d.fetchByIdentifiers).toHaveBeenCalledWith([{ set: 'lea', collector_number: '232' }]);
    expect(results.every((result) => 'printing' in result)).toBe(true);
  });

  it('looks up non-English printings one at a time', async () => {
    const d = deps({
      fetchBySetNumberLang: vi.fn().mockResolvedValue(card({ lang: 'ja' })),
    });

    const [result] = await resolveImportRows([row({ language: 'ja' })], d);

    expect(d.fetchBySetNumberLang).toHaveBeenCalledWith('lea', '232', 'ja');
    expect(d.fetchByIdentifiers).not.toHaveBeenCalled();
    expect(result).toMatchObject({ printing: { language: 'ja' } });
  });

  it('looks up rows by Scryfall ID', async () => {
    const id = '0000579f-7b35-4ed3-b44c-db2a538066fe';
    const d = deps({ fetchByIdentifiers: vi.fn().mockResolvedValue([card()]) });

    const [result] = await resolveImportRows([row({ scryfallId: id })], d);

    expect(d.fetchByIdentifiers).toHaveBeenCalledWith([{ id }]);
    expect(result).toMatchObject({ printing: { scryfallId: id } });
  });

  it('gives an error for cards that cannot be found', async () => {
    const [result] = await resolveImportRows([row()], deps());
    expect(result).toMatchObject({ error: expect.stringContaining('Card not found') });
  });

  it('gives an error when the finish is not available', async () => {
    const [result] = await resolveImportRows(
      [row({ finish: 'foil' })],
      deps({ fetchByIdentifiers: vi.fn().mockResolvedValue([card()]) }),
    );
    expect(result).toMatchObject({ error: expect.stringContaining('not available') });
  });

  it('splits Scryfall requests into batches of 75', async () => {
    const rows = Array.from({ length: 80 }, (_, i) =>
      row({ line: i + 2, collectorNumber: `${i}` }),
    );
    const d = deps({ fetchByIdentifiers: vi.fn().mockResolvedValue([]) });
    const progress = vi.fn();

    await resolveImportRows(rows, d, progress);

    expect(d.fetchByIdentifiers).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenLastCalledWith({ stage: 'scryfall', done: 80, total: 80 });
  });
});
