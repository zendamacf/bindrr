'use client';

import { Box, type DefaultMantineColor } from '@mantine/core';
import type { CSSProperties } from 'react';
import { finishFromFlags } from '@/lib/collection/finish';

const colorOverlay = (color: DefaultMantineColor): CSSProperties => ({
  background: `
    linear-gradient(
      105deg,
      transparent 35%,
      color-mix(in srgb, var(--mantine-color-${color}-3) 50%, transparent) 44%,
      color-mix(in srgb, var(--mantine-color-${color}-1) 65%, transparent) 50%,
      color-mix(in srgb, var(--mantine-color-${color}-4) 48%, transparent) 56%,
      transparent 65%
    ),
    linear-gradient(
      25deg,
      color-mix(in srgb, var(--mantine-color-${color}-6) 30%, transparent),
      transparent 72%
    )
  `,
  mixBlendMode: 'color-dodge',
  opacity: 0.9,
});

function overlayStyleForFlags(foil: boolean, etched: boolean): CSSProperties | null {
  const finish = finishFromFlags(foil, etched);
  if (finish === 'foil') return colorOverlay('cyan');
  if (finish === 'etched') return colorOverlay('violet');
  return null;
}

type FinishImageOverlayProps = {
  foil: boolean;
  etched: boolean;
};

export function FinishImageOverlay({ foil, etched }: FinishImageOverlayProps) {
  const overlayStyle = overlayStyleForFlags(foil, etched);
  if (!overlayStyle) return null;

  return (
    <Box
      pos="absolute"
      inset={0}
      aria-hidden
      style={{
        ...overlayStyle,
        pointerEvents: 'none',
      }}
    />
  );
}
