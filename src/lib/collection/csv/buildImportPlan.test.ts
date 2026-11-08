import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('./findStoredPrintings', () => ({ findStoredPrintings: vi.fn() }));

import { buildImportPlan, ownedKey, type PlanDeps } from './buildImportPlan';
import { commitImportPlan } from './commitImport';

const stored = {
  printingId: 7,
  scryfallId: '0000579f-7b35-4ed3-b44c-db2a538066fe',
  name: 'Sol Ring',
  setCode: 'LEA',
  collectorNumber: '232',
  language: 'en',
  price: '100',
  foilprice: '200',
  etchedprice: null,
};

function planDeps(owned: Map<string, number> = new Map()): PlanDeps {
  return {
    resolve: {
      findStoredPrintings: vi
        .fn()
        .mockImplementation(async () => new Map([['sn:lea:232:en', stored]])),
      fetchByIdentifiers: vi.fn().mockResolvedValue([]),
      fetchBySetNumberLang: vi.fn().mockResolvedValue(null),
      pause: vi.fn().mockResolvedValue(undefined),
    },
    findOwnedQuantities: vi.fn().mockResolvedValue(owned),
  };
}

const HEADER = 'set,collector_number,quantity,finish\n';

describe('buildImportPlan', () => {
  it('returns the fatal error for an unreadable file', async () => {
    const plan = await buildImportPlan('set,quantity\nlea,1', 1, planDeps());
    expect(plan.fatal).toMatch(/collector_number/);
    expect(plan.entries).toEqual([]);
  });

  it('gives before and after quantities for cards the user owns', async () => {
    const owned = new Map([[ownedKey(7, 'nonfoil'), 2]]);
    const plan = await buildImportPlan(`${HEADER}lea,232,3,nonfoil`, 1, planDeps(owned));

    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]).toMatchObject({
      currentQuantity: 2,
      quantityToAdd: 3,
      newQuantity: 5,
    });
  });

  it('starts at 0 for cards the user does not own', async () => {
    const plan = await buildImportPlan(`${HEADER}lea,232,3,nonfoil`, 1, planDeps());
    expect(plan.entries[0]).toMatchObject({ currentQuantity: 0, newQuantity: 3 });
  });

  it('keeps the finishes of one printing separate and merges duplicate rows', async () => {
    const owned = new Map([[ownedKey(7, 'foil'), 1]]);
    const plan = await buildImportPlan(
      `${HEADER}lea,232,1,nonfoil\nlea,232,2,nonfoil\nlea,232,1,foil`,
      1,
      planDeps(owned),
    );

    expect(plan.entries).toHaveLength(2);
    expect(plan.entries[0]).toMatchObject({
      finish: 'nonfoil',
      lines: [2, 3],
      quantityToAdd: 3,
      newQuantity: 3,
    });
    expect(plan.entries[1]).toMatchObject({ finish: 'foil', currentQuantity: 1, newQuantity: 2 });
  });

  it('collects row errors in line order', async () => {
    const plan = await buildImportPlan(
      `${HEADER}lea,232,0,nonfoil\nlea,232,1,etched`,
      1,
      planDeps(),
    );
    expect(plan.entries).toEqual([]);
    expect(plan.errors.map((e) => e.line)).toEqual([2, 3]);
  });

  it('reports progress', async () => {
    const progress = vi.fn();
    await buildImportPlan(`${HEADER}lea,232,1,nonfoil`, 1, planDeps(), progress);
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'parse' }));
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'lookup' }));
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'collection' }));
  });
});

describe('commitImportPlan', () => {
  it('counts added, updated, skipped and failed entries', async () => {
    const owned = new Map([[ownedKey(7, 'nonfoil'), 2]]);
    const plan = await buildImportPlan(
      `${HEADER}lea,232,3,nonfoil\nlea,232,1,foil\nlea,232,x,foil`,
      1,
      planDeps(owned),
    );
    const write = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('db'));

    const summary = await commitImportPlan(plan, 1, undefined, write);

    expect(write).toHaveBeenCalledTimes(2);
    expect(summary).toMatchObject({ added: 0, updated: 1, skipped: 1, failed: 1, copiesAdded: 3 });
    expect(summary.errors.map((e) => e.line)).toEqual([3, 4]);
  });
});
