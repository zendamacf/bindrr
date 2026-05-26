'use client';

import { Box, useMantineColorScheme } from '@mantine/core';
import {
  raritySymbolTierFromLabel,
  setSymbolMaskStyle,
  setSymbolRarityStyle,
} from '@/lib/collection/setSymbolRarityStyle';

type SetSymbolProps = {
  setSymbolUrl: string | null;
  rarity: string | null;
  size?: number;
  alt?: string;
};

export function SetSymbol({ setSymbolUrl, rarity, size = 20, alt = '' }: SetSymbolProps) {
  const { colorScheme } = useMantineColorScheme();
  const resolvedScheme = colorScheme === 'dark' ? 'dark' : 'light';

  if (!setSymbolUrl) return null;

  const tier = raritySymbolTierFromLabel(rarity);

  return (
    <Box
      component="span"
      role="img"
      aria-label={alt || 'Set symbol'}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        ...setSymbolMaskStyle(setSymbolUrl, size),
        ...setSymbolRarityStyle(tier, resolvedScheme),
      }}
    />
  );
}
