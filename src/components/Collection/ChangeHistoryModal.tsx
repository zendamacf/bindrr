'use client';

import { Modal, ScrollArea, Table, Text } from '@mantine/core';
import { formatLogChange, formatLogOccurred } from '@/lib/collection/formatLogChange';
import type { CollectionItemDetail } from '@/lib/collection/types';

const HISTORY_MODAL_Z_INDEX = 2100;

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
                  <Table.Td>{formatLogOccurred(entry.occurred)}</Table.Td>
                  <Table.Td
                    ta="right"
                    c={entry.change > 0 ? 'green' : entry.change < 0 ? 'red' : undefined}
                  >
                    {formatLogChange(entry.change)}
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
