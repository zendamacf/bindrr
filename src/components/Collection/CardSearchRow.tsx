import { ActionIcon, Group, Table } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react/Plus';
import Image from 'next/image';
import type { CardSearchResult } from '@/lib/collection/types';

type CardSearchRowProps = {
  result: CardSearchResult;
  onAdd: (result: CardSearchResult) => void;
};

export function CardSearchRow({ result, onAdd }: CardSearchRowProps) {
  return (
    <Table.Tr>
      <Table.Td w={48}>
        <ActionIcon
          variant="filled"
          color="green"
          aria-label={`Add ${result.name}`}
          onClick={() => onAdd(result)}
        >
          <PlusIcon size={16} />
        </ActionIcon>
      </Table.Td>
      <Table.Td w={48}>
        {result.imageUrl && (
          <Image
            src={result.imageUrl}
            alt=""
            width={32}
            height={45}
            unoptimized
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <span>
            {result.name}
            {result.language ? ` (${result.language})` : ''}
          </span>
        </Group>
        <span style={{ opacity: 0.6, fontSize: 'var(--mantine-font-size-sm)' }}>
          #{result.collectorNumber}
        </span>
      </Table.Td>
      <Table.Td visibleFrom="sm">
        {result.setName} ({result.setCode})
      </Table.Td>
      <Table.Td hiddenFrom="sm">{result.setCode}</Table.Td>
    </Table.Tr>
  );
}
