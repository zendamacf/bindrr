'use client';

import { SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { CardSymbolText } from '@/components/Card/CardSymbolText';
import { fetchCollectionItemScryfall } from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { ScryfallCardExtendedDetails } from '@/lib/collection/types';

type CollectionScryfallDetailsProps = {
  collectionPrintingId: number;
  scryfallId: string | null;
  /** Tighter two-column layout for wide modals. */
  compact?: boolean;
};

function formatReleased(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function DetailRow({ label, value }: { label: string; value: ReactNode | null }) {
  if (value == null || value === '') return null;
  return (
    <Text size="sm">
      <Text span fw={600}>
        {label}:{' '}
      </Text>
      {value}
    </Text>
  );
}

function DetailsContent({
  details,
  compact,
}: {
  details: ScryfallCardExtendedDetails;
  compact?: boolean;
}) {
  const released = formatReleased(details.releasedAt);

  const metaRows = (
    <>
      <DetailRow
        label="Mana cost"
        value={details.manaCost ? <CardSymbolText text={details.manaCost} symbolSize={18} /> : null}
      />
      <DetailRow label="Type" value={details.typeLine} />
      <DetailRow label="Flavor" value={details.flavorText} />
      <DetailRow label="Artist" value={details.artist} />
      <DetailRow label="Released" value={released} />
    </>
  );

  return (
    <Stack gap="xs">
      {compact ? <SimpleGrid cols={{ base: 1, sm: 2 }}>{metaRows}</SimpleGrid> : metaRows}
      {details.oracleText && (
        <Stack gap={2}>
          <Text size="sm" fw={600}>
            Oracle text
          </Text>
          <CardSymbolText
            text={details.oracleText}
            size="sm"
            symbolSize={14}
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </Stack>
      )}
    </Stack>
  );
}

export function CollectionScryfallDetails({
  collectionPrintingId,
  scryfallId,
  compact = false,
}: CollectionScryfallDetailsProps) {
  const scryfallQuery = useQuery({
    queryKey: collectionKeys.itemScryfall(collectionPrintingId),
    queryFn: () => fetchCollectionItemScryfall(collectionPrintingId),
    enabled: scryfallId != null,
  });

  if (!scryfallId) {
    return (
      <Text size="sm" c="dimmed">
        Extended card details are not available for this printing.
      </Text>
    );
  }

  if (scryfallQuery.isPending) {
    return (
      <Stack gap="xs" mih={88}>
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="65%" />
        <Skeleton height={14} width="72%" />
        <Skeleton height={14} width="50%" />
      </Stack>
    );
  }

  if (scryfallQuery.error) {
    return (
      <Text size="sm" c="dimmed">
        Could not load Scryfall details.
      </Text>
    );
  }

  if (!scryfallQuery.data) return null;

  return <DetailsContent details={scryfallQuery.data} compact={compact} />;
}
