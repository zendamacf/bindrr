'use client';

import { Box, useComputedColorScheme } from '@mantine/core';
import {
  raritySymbolTierFromCode,
  setSymbolRarityStyle,
} from '@/lib/collection/setSymbolRarityStyle';

type RaritySwatchProps = {
  rarityCode: string | null;
  size?: number;
};

export function RaritySwatch({ rarityCode, size = 20 }: RaritySwatchProps) {
  const resolvedScheme = useComputedColorScheme('light');

  if (!rarityCode) return null;

  const tier = raritySymbolTierFromCode(rarityCode);

  return (
    <Box
      component="span"
      aria-hidden
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: 2,
        ...setSymbolRarityStyle(tier, resolvedScheme),
      }}
    />
  );
}
