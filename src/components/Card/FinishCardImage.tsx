'use client';

import { Box } from '@mantine/core';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { FinishImageOverlay } from './FinishImageOverlay';

type FinishCardImageProps = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  foil: boolean;
  etched: boolean;
  borderRadius?: number;
  objectFit?: CSSProperties['objectFit'];
  style?: CSSProperties;
};

export function FinishCardImage({
  src,
  alt = '',
  width,
  height,
  foil,
  etched,
  borderRadius = 8,
  objectFit = 'cover',
  style,
}: FinishCardImageProps) {
  return (
    <Box
      pos="relative"
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width,
        maxWidth: '100%',
        aspectRatio: `${width} / ${height}`,
        borderRadius,
        overflow: 'hidden',
        lineHeight: 0,
        ...style,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        style={{ display: 'block', width: '100%', height: '100%', objectFit }}
      />
      <FinishImageOverlay foil={foil} etched={etched} />
    </Box>
  );
}
