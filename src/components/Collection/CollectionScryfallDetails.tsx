'use client';

import { Group, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { CardSymbolText } from '@/components/Card/CardSymbolText';
import { fetchCollectionItemScryfall } from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { ScryfallCardExtendedDetails } from '@/lib/collection/types';

type CollectionScryfallDetailsProps = {
  collectionPrintingId: number;
  scryfallId: string | null;
};

function formatReleased(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function DetailsContent({ details }: { details: ScryfallCardExtendedDetails }) {
  const released = formatReleased(details.releasedAt);
  const hasHeading = details.typeLine || details.manaCost;
  const credits = [
    details.artist ? `Illustrated by ${details.artist}` : null,
    released ? `Released ${released}` : null,
  ].filter((part): part is string => part != null);

  return (
    <Stack gap="sm">
      {hasHeading && (
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Text fw={600} style={{ minWidth: 0 }}>
            {details.typeLine}
          </Text>
          {details.manaCost && <CardSymbolText text={details.manaCost} symbolSize={18} />}
        </Group>
      )}
      {details.oracleText && (
        <CardSymbolText
          text={details.oracleText}
          size="sm"
          symbolSize={14}
          style={{ whiteSpace: 'pre-wrap', maxWidth: '60ch' }}
        />
      )}
      {details.flavorText && (
        <Text
          size="sm"
          fs="italic"
          c="dimmed"
          pl="sm"
          style={{
            whiteSpace: 'pre-wrap',
            maxWidth: '60ch',
            borderLeft: '2px solid var(--mantine-color-default-border)',
          }}
        >
          {details.flavorText}
        </Text>
      )}
      {credits.length > 0 && (
        <Group gap="md" wrap="wrap">
          {credits.map((credit) => (
            <Text key={credit} size="xs" c="dimmed">
              {credit}
            </Text>
          ))}
        </Group>
      )}
    </Stack>
  );
}

export function CollectionScryfallDetails({
  collectionPrintingId,
  scryfallId,
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

  return <DetailsContent details={scryfallQuery.data} />;
}
