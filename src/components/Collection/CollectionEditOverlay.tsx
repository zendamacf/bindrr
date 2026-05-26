'use client';

import { Box, Drawer, Group, Modal, Skeleton, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { CollectionEditBody, CollectionEditFooter } from './CollectionEditPanel';
import { PrintingExternalLinks } from './PrintingExternalLinks';
import { useCollectionEdit } from './useCollectionEdit';

type CollectionEditOverlayProps = {
  opened: boolean;
  onClose: () => void;
  collectionPrintingId: number | null;
  onCollectionPrintingIdChange: (id: number) => void;
  onRemoved: () => void;
  isMobile: boolean;
};

import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from './collectionEditZIndex';

const MODAL_CONTENT_WIDTH = 'var(--modal-size-xl)';

const editOverlayFooterStyle = {
  borderTop: '1px solid var(--mantine-color-default-border)',
  padding: 'var(--mantine-spacing-md)',
} as const;

function EditOverlayFooter({ children }: { children: ReactNode }) {
  return <Box style={editOverlayFooterStyle}>{children}</Box>;
}

function EditOverlayHeader({
  Title,
  CloseButton,
  name,
  printingLabel,
  linksLoading,
  scryfallId,
  tcgplayerProductId,
}: {
  Title: typeof Modal.Title;
  CloseButton: typeof Modal.CloseButton;
  name: string;
  printingLabel: string | null;
  linksLoading: boolean;
  scryfallId: string | null;
  tcgplayerProductId: string | null;
}) {
  return (
    <>
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Title fz="xl" fw={600} c="violet" m={0}>
          {linksLoading ? <Skeleton height={28} width={280} radius="sm" /> : name}
        </Title>
        {linksLoading ? (
          <Skeleton height={14} width={220} radius="sm" />
        ) : printingLabel ? (
          <Text size="sm" c="dimmed">
            {printingLabel}
          </Text>
        ) : null}
      </Stack>
      <Group gap="xs" wrap="nowrap">
        {linksLoading ? (
          <>
            <Skeleton height={30} width={88} radius="sm" />
            <Skeleton height={30} width={96} radius="sm" />
          </>
        ) : (
          <PrintingExternalLinks scryfallId={scryfallId} tcgplayerProductId={tcgplayerProductId} />
        )}
        <CloseButton />
      </Group>
    </>
  );
}

export function CollectionEditOverlay({
  opened,
  onClose,
  collectionPrintingId,
  onCollectionPrintingIdChange,
  onRemoved,
  isMobile,
}: CollectionEditOverlayProps) {
  const edit = useCollectionEdit(
    collectionPrintingId,
    onRemoved,
    opened && collectionPrintingId != null,
    onCollectionPrintingIdChange,
  );

  const item = edit?.item;
  const headerLoading = edit?.isPending ?? true;
  const displayName = item?.language
    ? `${item.name} (${item.language})`
    : (item?.name ?? 'Edit card');
  const printingLabel =
    item != null ? `${item.setName} (${item.setCode}) · #${item.collectorNumber}` : null;
  const headerLinks = {
    scryfallId: item?.scryfallId ?? null,
    tcgplayerProductId: item?.tcgplayerProductId ?? null,
  };

  const body = edit ? <CollectionEditBody edit={edit} /> : null;
  const footer = edit ? <CollectionEditFooter edit={edit} /> : null;

  if (isMobile) {
    return (
      <Drawer.Root
        opened={opened}
        onClose={onClose}
        position="bottom"
        size="100%"
        zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
      >
        <Drawer.Overlay />
        <Drawer.Content style={{ display: 'flex', flexDirection: 'column' }}>
          <Drawer.Header>
            <EditOverlayHeader
              Title={Drawer.Title}
              CloseButton={Drawer.CloseButton}
              name={displayName}
              printingLabel={printingLabel}
              linksLoading={headerLoading}
              {...headerLinks}
            />
          </Drawer.Header>
          <Drawer.Body p="sm" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {body}
          </Drawer.Body>
          <EditOverlayFooter>{footer}</EditOverlayFooter>
        </Drawer.Content>
      </Drawer.Root>
    );
  }

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
      styles={{ body: { flex: 'none', minHeight: 'unset' } }}
    >
      <Modal.Overlay />
      <Modal.Content
        w={MODAL_CONTENT_WIDTH}
        miw={MODAL_CONTENT_WIDTH}
        maw="calc(100vw - var(--mantine-spacing-xl) * 2)"
      >
        <Modal.Header>
          <EditOverlayHeader
            Title={Modal.Title}
            CloseButton={Modal.CloseButton}
            name={displayName}
            printingLabel={printingLabel}
            linksLoading={headerLoading}
            {...headerLinks}
          />
        </Modal.Header>
        <Modal.Body p="sm">{body}</Modal.Body>
        <EditOverlayFooter>{footer}</EditOverlayFooter>
      </Modal.Content>
    </Modal.Root>
  );
}
