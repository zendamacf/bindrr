'use client';

import { Box, Drawer, Modal, Skeleton, Stack, Text } from '@mantine/core';
import { type CSSProperties, type ReactNode, useEffect } from 'react';
import {
  CardNavButtons,
  CollectionEditBody,
  CollectionEditFooter,
  type CollectionEditNav,
} from './CollectionEditPanel';
import { useCollectionEdit } from './useCollectionEdit';

type CollectionEditOverlayProps = {
  opened: boolean;
  onClose: () => void;
  collectionPrintingId: number | null;
  onCollectionPrintingIdChange: (id: number) => void;
  onRemoved: () => void;
  isMobile: boolean;
  /** Neighbouring cards in the current list, for previous/next navigation. */
  prevId?: number | null;
  nextId?: number | null;
};

import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from './collectionEditZIndex';

const MODAL_CONTENT_WIDTH = 'var(--modal-size-xl)';

const mobileDrawerRootStyle = {
  '--drawer-flex': '1 1 auto',
  '--drawer-offset': '0rem',
} as CSSProperties;

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
  loading,
  nav,
}: {
  Title: typeof Modal.Title;
  CloseButton: typeof Modal.CloseButton;
  name: string;
  printingLabel: string | null;
  loading: boolean;
  /** Shown beside the close button; used on mobile, where the body has no room for it. */
  nav?: CollectionEditNav;
}) {
  return (
    <>
      <Stack gap={4} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Title
          fz="xl"
          fw={600}
          c="violet"
          m={0}
          style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
        >
          {loading ? <Skeleton height={28} width={240} maw="70%" radius="sm" /> : name}
        </Title>
        {loading ? (
          <Skeleton height={14} width={220} maw="55%" radius="sm" />
        ) : printingLabel ? (
          <Text size="sm" c="dimmed" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {printingLabel}
          </Text>
        ) : null}
      </Stack>
      {nav && <CardNavButtons nav={nav} size={40} />}
      <CloseButton style={{ flexShrink: 0 }} />
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
  prevId = null,
  nextId = null,
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
  const nav: CollectionEditNav = {
    prevId,
    nextId,
    onNavigate: onCollectionPrintingIdChange,
  };
  const nestedModalOpen = edit?.historyOpen || edit?.priceHistoryOpen;

  // Left/right arrow keys step through the list, unless the user is typing or a nested modal is open.
  useEffect(() => {
    if (!opened || nestedModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"], [aria-expanded="true"]')
      ) {
        return;
      }
      const id = e.key === 'ArrowLeft' ? prevId : nextId;
      if (id == null) return;
      e.preventDefault();
      onCollectionPrintingIdChange(id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [opened, nestedModalOpen, prevId, nextId, onCollectionPrintingIdChange]);

  const body = edit ? (
    <CollectionEditBody edit={edit} compact={isMobile} nav={isMobile ? undefined : nav} />
  ) : null;
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
              loading={headerLoading}
              nav={nav}
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
            loading={headerLoading}
          />
        </Modal.Header>
        <Modal.Body p="sm">{body}</Modal.Body>
        <EditOverlayFooter>{footer}</EditOverlayFooter>
      </Modal.Content>
    </Modal.Root>
  );
}
