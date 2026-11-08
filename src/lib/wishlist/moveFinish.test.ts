import { describe, expect, it } from 'vitest';
import { availableMoveFinishes, defaultMoveFinish } from './moveFinish';

const all = { canAddNonfoil: true, canAddFoil: true, canAddEtched: true };

describe('availableMoveFinishes', () => {
  it('returns all finishes of the printing in order', () => {
    expect(availableMoveFinishes(all)).toEqual(['nonfoil', 'foil', 'etched']);
  });

  it('returns only the finishes that the printing has', () => {
    expect(availableMoveFinishes({ ...all, canAddNonfoil: false })).toEqual(['foil', 'etched']);
    expect(
      availableMoveFinishes({ canAddNonfoil: false, canAddFoil: true, canAddEtched: false }),
    ).toEqual(['foil']);
  });
});

describe('defaultMoveFinish', () => {
  it('selects the finish of an item with a specific finish', () => {
    expect(defaultMoveFinish({ ...all, finish: 'foil' })).toBe('foil');
    expect(defaultMoveFinish({ ...all, finish: 'nonfoil' })).toBe('nonfoil');
  });

  it('does not select a finish that the printing does not have', () => {
    expect(defaultMoveFinish({ ...all, canAddFoil: false, finish: 'foil' })).toBeNull();
  });

  it('selects the only finish for an "any" item', () => {
    const foilOnly = { canAddNonfoil: false, canAddFoil: true, canAddEtched: false };
    expect(defaultMoveFinish({ ...foilOnly, finish: 'any' })).toBe('foil');
  });

  it('makes the user choose when an "any" item has more than one finish', () => {
    expect(defaultMoveFinish({ ...all, finish: 'any' })).toBeNull();
  });

  it('selects the only finish when a specific finish is not available', () => {
    const nonfoilOnly = { canAddNonfoil: true, canAddFoil: false, canAddEtched: false };
    expect(defaultMoveFinish({ ...nonfoilOnly, finish: 'etched' })).toBe('nonfoil');
  });
});
