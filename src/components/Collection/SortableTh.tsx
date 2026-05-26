import { Table } from '@mantine/core';
import type { CollectionSort } from '@/lib/collection/types';

export const SortableTh = ({
  column,
  label,
  onSort,
  indicator,
}: {
  column: CollectionSort;
  label: string;
  onSort: (column: CollectionSort) => void;
  indicator: (column: CollectionSort) => string;
}) => {
  return (
    <Table.Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(column)}>
      {label}
      {indicator(column)}
    </Table.Th>
  );
};
