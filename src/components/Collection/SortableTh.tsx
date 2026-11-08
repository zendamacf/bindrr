import { Table } from '@mantine/core';

export function SortableTh<TColumn extends string>({
  column,
  label,
  onSort,
  indicator,
}: {
  column: TColumn;
  label: string;
  onSort: (column: TColumn) => void;
  indicator: (column: TColumn) => string;
}) {
  return (
    <Table.Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(column)}>
      {label}
      {indicator(column)}
    </Table.Th>
  );
}
