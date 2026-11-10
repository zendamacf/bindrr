'use client';

import { Box } from '@mantine/core';
import Image from 'next/image';
import { type CSSProperties, type PointerEvent, useRef } from 'react';
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
  /** Max tilt in degrees. The card tilts in 3D toward the pointer on hover or touch-drag. Off when omitted. */
  tilt?: number;
  /** When false, touch input does not tilt and keeps scrolling the page. Default true. */
  tiltTouch?: boolean;
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
  tiltTouch = true,
}: FinishCardImageProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  // Plain cards aren't reflective, so keep their glare faint; foils add their own glint.
  const glareStrength = foil || etched ? 0.35 : 0.1;

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !tilt) return;
    if (e.pointerType === 'touch' && !tiltTouch) return;
    const rect = card.getBoundingClientRect();
    // Pointer position relative to the card centre, from -0.5 to 0.5.
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${(-py * 2 * tilt).toFixed(2)}deg) rotateY(${(px * 2 * tilt).toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.setProperty('--fx', `${((px + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty('--fy', `${((py + 0.5) * 100).toFixed(1)}%`);
    const glare = glareRef.current;
    if (glare) {
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,${glareStrength}), transparent 60%)`;
    }
  };

  const handleLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = '';
      card.style.removeProperty('--fx');
      card.style.removeProperty('--fy');
    }
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
              // Lets a touch drag tilt the card instead of scrolling the page.
              touchAction: tiltTouch ? 'none' : undefined,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }
          : {}),
        ...style,
      }}
      onPointerMove={tilt ? handleMove : undefined}
      onPointerLeave={tilt ? handleLeave : undefined}
      onPointerUp={tilt ? handleLeave : undefined}
      onPointerCancel={tilt ? handleLeave : undefined}
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
