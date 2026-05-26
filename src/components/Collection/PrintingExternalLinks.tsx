'use client';

import { Button, Group } from '@mantine/core';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ArrowSquareOut';
import { scryfallCardUrl, tcgplayerProductUrl } from '@/lib/collection/printingLinks';

const externalLinkIcon = <ArrowSquareOutIcon size={14} aria-hidden />;

type PrintingExternalLinksProps = {
  scryfallId: string | null;
  tcgplayerProductId: string | null;
};

export function PrintingExternalLinks({
  scryfallId,
  tcgplayerProductId,
}: PrintingExternalLinksProps) {
  if (!scryfallId && !tcgplayerProductId) return null;

  return (
    <Group gap="xs" wrap="nowrap">
      {scryfallId && (
        <Button
          component="a"
          href={scryfallCardUrl(scryfallId)}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="compact-sm"
          rightSection={externalLinkIcon}
        >
          Scryfall
        </Button>
      )}
      {tcgplayerProductId && (
        <Button
          component="a"
          href={tcgplayerProductUrl(tcgplayerProductId)}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="compact-sm"
          rightSection={externalLinkIcon}
        >
          TCGPlayer
        </Button>
      )}
    </Group>
  );
}
