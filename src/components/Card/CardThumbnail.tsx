'use client';

import { HoverCard, UnstyledButton } from '@mantine/core';
import { FinishCardImage } from './FinishCardImage';

const PREVIEW_Z_INDEX = 2100;

type CardThumbnailProps = {
  imageUrl: string;
  altLabel: string;
  onPreview: () => void;
  /** When true, click does not bubble (e.g. row behind the thumbnail is also clickable). */
  stopPropagation?: boolean;
  width?: number;
  height?: number;
  foil?: boolean;
  etched?: boolean;
};

export function CardThumbnail({
  imageUrl,
  altLabel,
  onPreview,
  stopPropagation = false,
  width = 32,
  height = 45,
  foil = false,
  etched = false,
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
          <FinishCardImage
            src={imageUrl}
            width={width}
            height={height}
            foil={foil}
            etched={etched}
            borderRadius={4}
            objectFit="cover"
          />
        </UnstyledButton>
      </HoverCard.Target>
      <HoverCard.Dropdown p="xs" style={{ zIndex: PREVIEW_Z_INDEX }}>
        <FinishCardImage
          src={imageUrl}
          width={244}
          height={340}
          foil={foil}
          etched={etched}
          objectFit="cover"
          style={{ maxWidth: '100%' }}
        />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
