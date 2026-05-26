import { describe, expect, it } from 'vitest';
import { scryfallFinishAvailability } from './client';

describe('scryfallFinishAvailability', () => {
  it('enables buttons based on finishes array', () => {
    expect(scryfallFinishAvailability(['nonfoil', 'foil'])).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: false,
    });
    expect(scryfallFinishAvailability(['nonfoil'])).toEqual({
      canAddNonfoil: true,
      canAddFoil: false,
      canAddEtched: false,
    });
    expect(scryfallFinishAvailability(['foil'])).toEqual({
      canAddNonfoil: false,
      canAddFoil: true,
      canAddEtched: false,
    });
    expect(scryfallFinishAvailability(['etched'])).toEqual({
      canAddNonfoil: false,
      canAddFoil: false,
      canAddEtched: true,
    });
  });

  it('allows all when finishes are missing', () => {
    expect(scryfallFinishAvailability(undefined)).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: true,
    });
  });
});
