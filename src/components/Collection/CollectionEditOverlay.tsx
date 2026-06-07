'use client';

import { Box, Drawer, Group, Modal, Skeleton, Stack, Text } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
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

const mobileDrawerRootStyle: CSSProperties = {
  '--drawer-flex': '1 1 auto',
  '--drawer-offset': '0rem',
};

const mobileDrawerStyles = {
  inner: {
    width: '100vw',
    maxWidth: '100vw',
    minWidth: 0,
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: '100dvh',
    width: '100vw',
    maxWidth: '100vw',
    minWidth: 0,
    margin: 0,
  },
  header: { flexShrink: 0, minWidth: 0, maxWidth: '100%' },
  body: { flex: 1, minHeight: 0, minWidth: 0, maxWidth: '100%', overflow: 'auto' },
} as const;

const editOverlayFooterStyle = {
  borderTop: '1px solid var(--mantine-color-default-border)',
  padding: 'var(--mantine-spacing-md)',
  flexShrink: 0,
  minWidth: 0,
  width: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
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
  compact,
}: {
  Title: typeof Modal.Title;
  CloseButton: typeof Modal.CloseButton;
  name: string;
  printingLabel: string | null;
  linksLoading: boolean;
  scryfallId: string | null;
  tcgplayerProductId: string | null;
  compact?: boolean;
}) {
  const titleBlock = (
    <Stack gap={4} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <Title
        fz="xl"
        fw={600}
        c="violet"
        m={0}
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
      >
        {linksLoading ? <Skeleton height={28} width={compact ? '70%' : 280} radius="sm" /> : name}
      </Title>
      {linksLoading ? (
        <Skeleton height={14} width={compact ? '55%' : 220} radius="sm" />
      ) : printingLabel ? (
        <Text size="sm" c="dimmed" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
          {printingLabel}
        </Text>
      ) : null}
    </Stack>
  );

  const linksBlock = linksLoading ? (
    <Group gap="xs" wrap={compact ? 'wrap' : 'nowrap'}>
      <Skeleton height={30} width={88} radius="sm" />
      <Skeleton height={30} width={96} radius="sm" />
    </Group>
  ) : (
    <PrintingExternalLinks
      scryfallId={scryfallId}
      tcgplayerProductId={tcgplayerProductId}
      wrap={compact ? 'wrap' : 'nowrap'}
    />
  );

  if (compact) {
    return (
      <Stack gap="xs" w="100%" style={{ flex: 1, minWidth: 0 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          {titleBlock}
          <CloseButton style={{ flexShrink: 0 }} />
        </Group>
        {linksBlock}
      </Stack>
    );
  }

  return (
    <>
      {titleBlock}
      <Group gap="xs" wrap="nowrap">
        {linksBlock}
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
  const displayName = item?.name ?? 'Edit card';
  const printingLabel =
    item != null
      ? `${item.setName} (${item.setCode}) · #${item.collectorNumber} · ${item.language}`
      : null;
  const headerLinks = {
    scryfallId: item?.scryfallId ?? null,
    tcgplayerProductId: item?.tcgplayerProductId ?? null,
  };

  const body = edit ? <CollectionEditBody edit={edit} compact={isMobile} /> : null;
  const footer = edit ? <CollectionEditFooter edit={edit} compact={isMobile} /> : null;

  if (isMobile) {
    return (
      <Drawer.Root
        opened={opened}
        onClose={onClose}
        position="bottom"
        size="100%"
        zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
        style={mobileDrawerRootStyle}
        styles={mobileDrawerStyles}
      >
        <Drawer.Overlay />
        <Drawer.Content style={mobileDrawerStyles.content as CSSProperties}>
          <Drawer.Header>
            <EditOverlayHeader
              Title={Drawer.Title}
              CloseButton={Drawer.CloseButton}
              name={displayName}
              printingLabel={printingLabel}
              linksLoading={headerLoading}
              compact
              {...headerLinks}
            />
          </Drawer.Header>
          <Drawer.Body p="sm">
            <Box w="100%" maw="100%" style={{ minWidth: 0, overflow: 'hidden' }}>
              {body}
            </Box>
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
