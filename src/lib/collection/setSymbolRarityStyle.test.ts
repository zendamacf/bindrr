import { describe, expect, it } from 'vitest';
import {
  commonSetSymbolBackground,
  raritySymbolTierFromCode,
  raritySymbolTierFromLabel,
  setSymbolMaskStyle,
  setSymbolRarityStyle,
} from './setSymbolRarityStyle';

describe('raritySymbolTierFromLabel', () => {
  it('maps display labels', () => {
    expect(raritySymbolTierFromLabel('Common')).toBe('common');
    expect(raritySymbolTierFromLabel('Uncommon')).toBe('uncommon');
    expect(raritySymbolTierFromLabel('Rare')).toBe('rare');
    expect(raritySymbolTierFromLabel('Mythic')).toBe('mythic');
    expect(raritySymbolTierFromLabel('Special')).toBe('special');
    expect(raritySymbolTierFromLabel(null)).toBe('common');
  });
});

describe('raritySymbolTierFromCode', () => {
  it('maps single-letter codes', () => {
    expect(raritySymbolTierFromCode('U')).toBe('uncommon');
    expect(raritySymbolTierFromCode('R')).toBe('rare');
    expect(raritySymbolTierFromCode('m')).toBe('mythic');
    expect(raritySymbolTierFromCode('S')).toBe('special');
    expect(raritySymbolTierFromCode(null)).toBe('common');
  });
});

describe('commonSetSymbolBackground', () => {
  it('is dark on light theme and light on dark theme', () => {
    expect(commonSetSymbolBackground('light')).toBe('rgb(33, 33, 33)');
    expect(commonSetSymbolBackground('dark')).toBe('rgb(235, 235, 235)');
  });
});

describe('setSymbolRarityStyle', () => {
  it('uses a theme-aware flat fill for common', () => {
    const lightStyle = setSymbolRarityStyle('common', 'light');
    expect(lightStyle.background).toBe('rgb(33, 33, 33)');
    expect(lightStyle.filter).toContain('drop-shadow');

    const darkStyle = setSymbolRarityStyle('common', 'dark');
    expect(darkStyle.background).toBe('rgb(235, 235, 235)');
    expect(darkStyle.filter).toContain('drop-shadow');
  });

  it('uses a gradient and shadow for rare', () => {
    const style = setSymbolRarityStyle('rare');
    expect(style.background).toContain('linear-gradient');
    expect(style.filter).toContain('drop-shadow');
  });

  it('styles uncommon and mythic tiers', () => {
    expect(setSymbolRarityStyle('uncommon').filter).toContain('drop-shadow');
    expect(setSymbolRarityStyle('mythic').background).toContain('linear-gradient');
    expect(setSymbolRarityStyle('special').background).toContain('linear-gradient');
  });
});

describe('setSymbolMaskStyle', () => {
  it('builds CSS mask properties from the symbol URL', () => {
    expect(setSymbolMaskStyle('https://svgs.scryfall.io/sets/dmr.svg', 20)).toMatchObject({
      width: 20,
      height: 20,
      maskImage: 'url(https://svgs.scryfall.io/sets/dmr.svg)',
      WebkitMaskSize: 'contain',
    });
  });
});
