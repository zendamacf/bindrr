import { describe, expect, it } from 'vitest';
import { scryfallFinishAvailability } from './client';

describe('scryfallFinishAvailability', () => {
  it('enables buttons based on finishes array', () => {
    expect(scryfallFinishAvailability(['nonfoil', 'foil'])).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
    });
    expect(scryfallFinishAvailability(['nonfoil'])).toEqual({
      canAddNonfoil: true,
      canAddFoil: false,
    });
    expect(scryfallFinishAvailability(['foil'])).toEqual({
      canAddNonfoil: false,
      canAddFoil: true,
    });
    expect(scryfallFinishAvailability(['etched'])).toEqual({
      canAddNonfoil: false,
      canAddFoil: true,
    });
  });

  it('allows both when finishes are missing', () => {
    expect(scryfallFinishAvailability(undefined)).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
    });
  });
});
