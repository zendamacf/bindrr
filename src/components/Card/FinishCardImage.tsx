'use client';

import { Box } from '@mantine/core';
import Image from 'next/image';
import { type CSSProperties, type MouseEvent, useRef } from 'react';
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
  /** Max tilt in degrees. The card tilts in 3D toward the pointer on hover. Off when omitted. */
  tilt?: number;
};

const PERSPECTIVE_PX = 800;

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
  tilt,
}: FinishCardImageProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !tilt) return;
    const rect = card.getBoundingClientRect();
    // Pointer position relative to the card centre, from -0.5 to 0.5.
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${(-py * 2 * tilt).toFixed(2)}deg) rotateY(${(px * 2 * tilt).toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;
    const glare = glareRef.current;
    if (glare) {
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.35), transparent 60%)`;
    }
  };

  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  return (
    <Box
      ref={cardRef}
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
        ...(tilt
          ? {
              transition: 'transform 150ms ease-out',
              willChange: 'transform',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }
          : {}),
        ...style,
      }}
      onMouseMove={tilt ? handleMove : undefined}
      onMouseLeave={tilt ? handleLeave : undefined}
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
      {tilt ? (
        <div
          ref={glareRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 150ms ease-out',
          }}
        />
      ) : null}
    </Box>
  );
}
