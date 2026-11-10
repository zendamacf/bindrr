import { ActionIcon, Group, SegmentedControl, Select } from '@mantine/core';
import { RowsIcon } from '@phosphor-icons/react/Rows';
import { SortAscendingIcon } from '@phosphor-icons/react/SortAscending';
import { SortDescendingIcon } from '@phosphor-icons/react/SortDescending';
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour';
import type { ListingView } from './useListingView';

type ListingControlsProps<TSort extends string> = {
  view: ListingView;
  onViewChange: (view: ListingView) => void;
  /** Sort controls show in the binder view (the list view sorts from its headers) and on phones. */
  showSort: boolean;
  sort: TSort;
  sortOptions: { value: TSort; label: string }[];
  onSortChange: (sort: TSort) => void;
  sortDesc: 'asc' | 'desc';
  onSortDirectionToggle: () => void;
  compact?: boolean;
};

export function ListingControls<TSort extends string>({
  view,
  onViewChange,
  showSort,
  sort,
  sortOptions,
  onSortChange,
  sortDesc,
  onSortDirectionToggle,
  compact = false,
}: ListingControlsProps<TSort>) {
  return (
    <Group gap="xs" wrap="nowrap">
      {showSort && (
        <>
          <Select
            aria-label="Sort by"
            w={compact ? 120 : 140}
            data={sortOptions}
            value={sort}
            onChange={(value) => {
              if (value) onSortChange(value as TSort);
            }}
            allowDeselect={false}
          />
          <ActionIcon
            variant="default"
            size={36}
            aria-label={sortDesc === 'asc' ? 'Sort ascending' : 'Sort descending'}
            onClick={onSortDirectionToggle}
          >
            {sortDesc === 'asc' ? (
              <SortAscendingIcon size={18} />
            ) : (
              <SortDescendingIcon size={18} />
            )}
          </ActionIcon>
        </>
      )}
      <SegmentedControl
        aria-label="View"
        value={view}
        onChange={(v) => onViewChange(v as ListingView)}
        data={[
          {
            value: 'binder',
            label: (
              <Group gap={6} wrap="nowrap">
                <SquaresFourIcon size={16} />
                <span>Binder</span>
              </Group>
            ),
          },
          {
            value: 'table',
            label: (
              <Group gap={6} wrap="nowrap">
                <RowsIcon size={16} />
                <span>List</span>
              </Group>
            ),
          },
        ]}
      />
    </Group>
  );
}
