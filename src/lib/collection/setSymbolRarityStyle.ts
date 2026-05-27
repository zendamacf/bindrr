import type { CSSProperties } from 'react';

/** MTG rarity tiers for set symbol styling (see codepen.io/jesseflorig/pen/EKGxbx). */
export type RaritySymbolTier = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special';

const SYMBOL_SHADOW = 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.85))';

function symbolGradient(deg: number, alt: string, primary: string): string {
  return `linear-gradient(${deg}deg, ${alt}, ${primary}, ${alt})`;
}

/** Map display rarity label from the API to a symbol style tier. */
export function raritySymbolTierFromLabel(rarity: string | null): RaritySymbolTier {
  switch (rarity) {
    case 'Uncommon':
      return 'uncommon';
    case 'Rare':
      return 'rare';
    case 'Mythic':
      return 'mythic';
    case 'Special':
      return 'special';
    default:
      return 'common';
  }
}

/** Map single-letter rarity code from the database. */
export function raritySymbolTierFromCode(rarityCode: string | null): RaritySymbolTier {
  switch (rarityCode?.toUpperCase()) {
    case 'U':
      return 'uncommon';
    case 'R':
      return 'rare';
    case 'M':
      return 'mythic';
    case 'S':
      return 'special';
    default:
      return 'common';
  }
}

export function commonSetSymbolBackground(colorScheme: 'light' | 'dark'): string {
  return colorScheme === 'dark' ? 'rgb(235, 235, 235)' : 'rgb(33, 33, 33)';
}

export function setSymbolRarityStyle(
  tier: RaritySymbolTier,
  colorScheme: 'light' | 'dark' = 'light',
): CSSProperties {
  switch (tier) {
    case 'uncommon':
      return {
        background: symbolGradient(45, 'rgb(70, 100, 110)', 'rgb(185, 220, 235)'),
        filter: SYMBOL_SHADOW,
      };
    case 'rare':
      return {
        background: symbolGradient(45, 'rgb(118, 98, 55)', 'rgb(230, 205, 140)'),
        filter: SYMBOL_SHADOW,
      };
    case 'mythic':
      return {
        background: symbolGradient(45, 'rgb(180, 50, 25)', 'rgb(245, 145, 5)'),
        filter: SYMBOL_SHADOW,
      };
    case 'special':
      return {
        background: symbolGradient(45, 'rgb(100, 40, 120)', 'rgb(195, 155, 200)'),
        filter: SYMBOL_SHADOW,
      };
    default:
      return { background: commonSetSymbolBackground(colorScheme), filter: SYMBOL_SHADOW };
  }
}

export function setSymbolMaskStyle(setSymbolUrl: string, size: number): CSSProperties {
  return {
    width: size,
    height: size,
    WebkitMaskImage: `url(${setSymbolUrl})`,
    maskImage: `url(${setSymbolUrl})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  };
}
