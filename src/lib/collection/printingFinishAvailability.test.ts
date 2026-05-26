import { describe, expect, it } from 'vitest';
import { printingFinishAvailability } from './printingFinishAvailability';

describe('printingFinishAvailability', () => {
  it('allows all finishes when no prices are stored', () => {
    expect(printingFinishAvailability(null, null, null)).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: true,
    });
  });

  it('reflects which prices exist on the printing', () => {
    expect(printingFinishAvailability('1.00', '2.00', null)).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: false,
    });
  });
});
