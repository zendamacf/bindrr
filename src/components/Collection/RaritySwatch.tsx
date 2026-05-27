'use client';

import { Box, useMantineColorScheme } from '@mantine/core';
import {
  raritySymbolTierFromCode,
  setSymbolRarityStyle,
} from '@/lib/collection/setSymbolRarityStyle';

type RaritySwatchProps = {
  rarityCode: string | null;
  size?: number;
};

export function RaritySwatch({ rarityCode, size = 20 }: RaritySwatchProps) {
  const { colorScheme } = useMantineColorScheme();
  const resolvedScheme = colorScheme === 'dark' ? 'dark' : 'light';

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
