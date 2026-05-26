import { describe, expect, it } from 'vitest';
import {
  addingKeyForFinish,
  finishFlags,
  finishFromFlags,
  finishLabel,
  finishLabelForFinish,
  finishMantineColor,
  finishMantineColorFromFlags,
} from './finish';

describe('finishFlags / finishFromFlags', () => {
  it('round-trips each finish', () => {
    for (const finish of ['nonfoil', 'foil', 'etched'] as const) {
      const { foil, etched } = finishFlags(finish);
      expect(finishFromFlags(foil, etched)).toBe(finish);
    }
  });

  it('maps finish to foil and etched columns', () => {
    expect(finishFlags('foil')).toEqual({ foil: true, etched: false });
    expect(finishFlags('etched')).toEqual({ foil: false, etched: true });
    expect(finishFlags('nonfoil')).toEqual({ foil: false, etched: false });
  });
});

describe('finish labels', () => {
  it('labels finishes from flags', () => {
    expect(finishLabel(false, false)).toBe('Non-foil');
    expect(finishLabel(true, false)).toBe('Foil');
    expect(finishLabel(false, true)).toBe('Etched');
  });

  it('labels finishes from CardFinish', () => {
    expect(finishLabelForFinish('etched')).toBe('Etched');
  });
});

describe('addingKeyForFinish', () => {
  it('keys by scryfall id and finish', () => {
    expect(addingKeyForFinish('abc', 'foil')).toBe('abc:foil');
  });
});

describe('finishMantineColor', () => {
  it('maps foil and etched to theme colors', () => {
    expect(finishMantineColor('foil')).toBe('cyan');
    expect(finishMantineColor('etched')).toBe('violet');
    expect(finishMantineColor('nonfoil')).toBeUndefined();
  });

  it('derives color from foil flags', () => {
    expect(finishMantineColorFromFlags(true, false)).toBe('cyan');
    expect(finishMantineColorFromFlags(false, true)).toBe('violet');
  });
});
