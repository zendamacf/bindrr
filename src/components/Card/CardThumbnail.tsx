'use client';

import { HoverCard, UnstyledButton } from '@mantine/core';
import Image from 'next/image';

const PREVIEW_Z_INDEX = 2100;

type CardThumbnailProps = {
  imageUrl: string;
  altLabel: string;
  onPreview: () => void;
  /** When true, click does not bubble (e.g. row behind the thumbnail is also clickable). */
  stopPropagation?: boolean;
  width?: number;
  height?: number;
};

export function CardThumbnail({
  imageUrl,
  altLabel,
  onPreview,
  stopPropagation = false,
  width = 32,
  height = 45,
}: CardThumbnailProps) {
  return (
    <HoverCard width={320} shadow="md" openDelay={250} withinPortal>
      <HoverCard.Target>
        <UnstyledButton
          aria-label={`Preview ${altLabel}`}
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
            onPreview();
          }}
          style={{ display: 'inline-block', cursor: 'zoom-in', flexShrink: 0 }}
        >
          <Image
            src={imageUrl}
            alt=""
            width={width}
            height={height}
            unoptimized
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        </UnstyledButton>
      </HoverCard.Target>
      <HoverCard.Dropdown p="xs" style={{ zIndex: PREVIEW_Z_INDEX }}>
        <Image
          src={imageUrl}
          alt=""
          width={244}
          height={340}
          unoptimized
          style={{ objectFit: 'cover', borderRadius: 8, width: '100%', height: 'auto' }}
        />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
