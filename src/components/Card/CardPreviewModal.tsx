'use client';

import { Modal, Stack, Text } from '@mantine/core';
import { FinishCardImage } from './FinishCardImage';
import type { CardPreviewDetails } from './types';

const PREVIEW_Z_INDEX = 2100;

type CardPreviewModalProps = {
  opened: boolean;
  onClose: () => void;
  preview: CardPreviewDetails | null;
};

export function CardPreviewModal({ opened, onClose, preview }: CardPreviewModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={preview?.name ?? 'Card image'}
      centered
      size="md"
      zIndex={PREVIEW_Z_INDEX}
    >
      {preview ? (
        <Stack gap="sm">
          {preview.imageUrl ? (
            <FinishCardImage
              src={preview.imageUrl}
              alt={preview.name}
              width={488}
              height={680}
              foil={preview.foil}
              etched={preview.etched}
              objectFit="contain"
              style={{ display: 'block', width: '100%' }}
            />
          ) : (
            <Text c="dimmed">No image available.</Text>
          )}

          {preview.metaLines.length > 0 && (
            <Stack gap={2}>
              {preview.metaLines.map((line) => (
                <Text key={line} size="sm" c="dimmed">
                  {line}
                </Text>
              ))}
            </Stack>
          )}
        </Stack>
      ) : null}
    </Modal>
  );
}
