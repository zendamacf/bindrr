'use client';

import { Box } from '@mantine/core';
import type { CSSProperties } from 'react';
import { finishFromFlags } from '@/lib/collection/finish';

/*
 * Foil and etched overlays are built from blend modes that keep the card's own
 * luminance (`color`, `soft-light`), so they tint and shimmer the art without
 * washing out text. They read `--fx` / `--fy` (pointer position, set by
 * FinishCardImage while tilting) so the sheen follows the pointer; the
 * fallbacks give a resting position.
 */

type Layer = CSSProperties;

const FOIL_LAYERS: Layer[] = [
  // Prismatic hue wash. `color` blend replaces hue only, so text stays legible.
  {
    background:
      'linear-gradient(115deg, #ff5f6d, #ffc371, #7bed9f, #4dd0e1, #7c83ff, #d36bff, #ff5f6d)',
    backgroundSize: '260% 260%',
    backgroundPosition: 'var(--fx, 30%) var(--fy, 30%)',
    mixBlendMode: 'color',
    opacity: 0.3,
  },
  // Diagonal glint band that sweeps with the pointer. `soft-light` can't blow out whites or darks.
  {
    background:
      'linear-gradient(105deg, transparent calc(var(--fx, 30%) - 18%), rgb(255 255 255 / 0.5) var(--fx, 30%), transparent calc(var(--fx, 30%) + 18%))',
    mixBlendMode: 'soft-light',
    opacity: 0.5,
  },
];

const ETCHED_LAYERS: Layer[] = [
  // Champagne-silver metallic tint.
  {
    background: 'linear-gradient(135deg, #d9c7a3, #f4efe6, #b9a57d, #efe6d2, #c9b48a)',
    backgroundSize: '240% 240%',
    backgroundPosition: 'var(--fx, 30%) var(--fy, 30%)',
    mixBlendMode: 'color',
    opacity: 0.25,
  },
  // Fine crosshatch texture, the hallmark of etched foil.
  {
    background: `
      repeating-linear-gradient(45deg, rgb(255 255 255 / 0.5) 0 1px, transparent 1px 4px),
      repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.4) 0 1px, transparent 1px 4px)
    `,
    mixBlendMode: 'soft-light',
    opacity: 0.35,
  },
  // Broad brushed-metal highlight.
  {
    background:
      'linear-gradient(105deg, transparent calc(var(--fx, 30%) - 18%), rgb(255 255 255 / 0.5) var(--fx, 30%), transparent calc(var(--fx, 30%) + 18%))',
    mixBlendMode: 'soft-light',
    opacity: 0.45,
  },
];

function layersForFlags(foil: boolean, etched: boolean): Layer[] | null {
  const finish = finishFromFlags(foil, etched);
  if (finish === 'foil') return FOIL_LAYERS;
  if (finish === 'etched') return ETCHED_LAYERS;
  return null;
}

type FinishImageOverlayProps = {
  foil: boolean;
  etched: boolean;
};

export function FinishImageOverlay({ foil, etched }: FinishImageOverlayProps) {
  const layers = layersForFlags(foil, etched);
  if (!layers) return null;

  return (
    <Box
      pos="absolute"
      inset={0}
      aria-hidden
      style={{ pointerEvents: 'none', isolation: 'isolate' }}
    >
      {layers.map((layer) => (
        <Box
          key={String(layer.background)}
          pos="absolute"
          inset={0}
          style={{ ...layer, transition: 'background-position 150ms ease-out' }}
        />
      ))}
    </Box>
  );
}
