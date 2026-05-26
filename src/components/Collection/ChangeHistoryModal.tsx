'use client';

import { Modal, ScrollArea, Table, Text } from '@mantine/core';
import type { CollectionItemDetail } from '@/lib/collection/types';

const HISTORY_MODAL_Z_INDEX = 2100;

function formatChange(change: number): string {
  if (change > 0) return `+${change}`;
  return String(change);
}

function formatOccurred(iso: string): string {
  return new Date(iso).toLocaleString();
}

type ChangeHistoryModalProps = {
  opened: boolean;
  onClose: () => void;
  history: CollectionItemDetail['history'];
};

export function ChangeHistoryModal({ opened, onClose, history }: ChangeHistoryModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Change history"
      size="md"
      centered
      zIndex={HISTORY_MODAL_Z_INDEX}
    >
      {history.length === 0 ? (
        <Text c="dimmed">No changes recorded yet.</Text>
      ) : (
        <ScrollArea.Autosize mah={400} type="auto">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>When</Table.Th>
                <Table.Th ta="right">Change</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{formatOccurred(entry.occurred)}</Table.Td>
                  <Table.Td
                    ta="right"
                    c={entry.change > 0 ? 'green' : entry.change < 0 ? 'red' : undefined}
                  >
                    {formatChange(entry.change)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
}
