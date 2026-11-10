'use client';

import {
  Alert,
  Button,
  FileInput,
  Group,
  List,
  Modal,
  Progress,
  ScrollArea,
  Stack,
  Table,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { trackUmamiEvent } from '@/lib/analytics/trackUmamiEvent';
import { umamiEvents } from '@/lib/analytics/umamiEvents';
import {
  commitCollectionImport,
  type ImportProgressUpdate,
  previewCollectionImport,
} from '@/lib/collection/csv/client';
import { IMPORT_MAX_BYTES } from '@/lib/collection/csv/parseImportRows';
import type { ImportPreviewResult, ImportSummaryResult } from '@/lib/collection/csv/types';
import { finishLabelForFinish } from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';
import { scryfallLanguageLabel } from '@/lib/scryfall/languages';
import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from './collectionEditZIndex';

/** The most rows the preview table shows. The import still uses all rows. */
const PREVIEW_ROW_LIMIT = 500;

type Step = 'input' | 'working' | 'preview' | 'done';

function progressLabel({ stage, done, total }: ImportProgressUpdate): string {
  switch (stage) {
    case 'parse':
      return 'Reading the file…';
    case 'lookup':
    case 'scryfall':
      return `Looking up cards… ${done} of ${total}`;
    case 'collection':
      return 'Checking your collection…';
    case 'commit':
      return `Adding cards… ${done} of ${total}`;
  }
}

function isDeterminate(stage: ImportProgressUpdate['stage']): boolean {
  return stage === 'lookup' || stage === 'scryfall' || stage === 'commit';
}

type ImportCsvModalProps = {
  opened: boolean;
  onClose: () => void;
  isMobile: boolean;
};

export function ImportCsvModal({ opened, onClose, isMobile }: ImportCsvModalProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('input');
  const [csv, setCsv] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ImportProgressUpdate | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [summary, setSummary] = useState<ImportSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const committingRef = useRef(false);

  const reset = () => {
    setStep('input');
    setCsv('');
    setFile(null);
    setProgress(null);
    setPreview(null);
    setSummary(null);
    setError(null);
  };

  const close = () => {
    // The server finishes an import that it started, so the dialog keeps its state.
    // The user sees the summary when the dialog opens again.
    if (committingRef.current) {
      onClose();
      return;
    }
    abortRef.current?.abort();
    if (step === 'done' || step === 'working') reset();
    onClose();
  };

  const run = async <T,>(work: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setProgress({ stage: 'parse', done: 0, total: 1 });
    setStep('working');
    try {
      return await work(controller.signal);
    } catch (e) {
      if (controller.signal.aborted) return null;
      setError(e instanceof Error ? e.message : 'The import failed. Try again.');
      return null;
    }
  };

  const startPreview = async () => {
    const result = await run((signal) => previewCollectionImport(csv, setProgress, signal));
    if (!result) {
      setStep('input');
      return;
    }
    if (result.fatal) {
      setError(result.fatal);
      setStep('input');
      return;
    }
    setPreview(result);
    setStep('preview');
  };

  const startImport = async () => {
    committingRef.current = true;
    const result = await run((signal) => commitCollectionImport(csv, setProgress, signal));
    committingRef.current = false;
    if (!result) {
      setStep('preview');
      return;
    }
    setSummary(result);
    setStep('done');
    trackUmamiEvent(umamiEvents.collectionImport, {
      added: result.added,
      updated: result.updated,
    });
    void qc.invalidateQueries({ queryKey: collectionKeys.all });
    notifications.show({
      message: `Import finished. ${result.copiesAdded} copies added.`,
      color: 'green',
    });
  };

  const onFile = async (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      setCsv('');
      return;
    }
    if (selected.size > IMPORT_MAX_BYTES) {
      setFile(null);
      setCsv('');
      setError('The file is too large. The limit is 5 MB.');
      return;
    }
    setFile(selected);
    setCsv(await selected.text());
  };

  const percent =
    progress && isDeterminate(progress.stage) && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 100;

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Import from CSV"
      size="xl"
      centered
      fullScreen={isMobile}
      padding="md"
      zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
    >
      <Stack gap="sm" data-testid="import-csv-modal">
        {error && (
          <Alert color="red" data-testid="import-csv-error">
            {error}
          </Alert>
        )}

        {step === 'input' && (
          <>
            <Text size="sm" c="dimmed">
              Columns: <b>set</b>, <b>collector_number</b> and <b>quantity</b> are required.{' '}
              <b>language</b> (for example en or ja), <b>finish</b> (nonfoil, foil or etched) and{' '}
              <b>scryfall_id</b> are optional. The import adds to the quantities you have now.
            </Text>
            <FileInput
              label="CSV file"
              placeholder="Choose a file"
              accept=".csv,text/csv"
              clearable
              value={file}
              onChange={onFile}
            />
            {file ? (
              <Text size="sm" c="dimmed">
                Using {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB). Clear the file
                to paste CSV text.
              </Text>
            ) : (
              <Textarea
                label="Or paste CSV"
                placeholder={'set,collector_number,quantity,finish\nlea,232,1,nonfoil'}
                autosize
                minRows={5}
                maxRows={12}
                value={csv}
                onChange={(event) => setCsv(event.currentTarget.value)}
              />
            )}
            <Group justify="flex-end">
              <Button onClick={startPreview} disabled={csv.trim() === ''}>
                Preview
              </Button>
            </Group>
          </>
        )}

        {step === 'working' && progress && (
          <Stack gap="xs" data-testid="import-csv-progress">
            <Text size="sm">{progressLabel(progress)}</Text>
            <Progress
              value={percent}
              animated={!isDeterminate(progress.stage)}
              striped={!isDeterminate(progress.stage)}
              aria-label={progressLabel(progress)}
            />
          </Stack>
        )}

        {step === 'preview' && preview && (
          <>
            <Text size="sm">
              {preview.entries.length} {preview.entries.length === 1 ? 'card' : 'cards'} to add
              {preview.errors.length > 0 && `, ${preview.errors.length} with errors`}. If you import
              the same file again, the quantities go up again.
            </Text>

            {preview.errors.length > 0 && <RowErrors errors={preview.errors} />}

            <ScrollArea.Autosize mah={360}>
              <Table stickyHeader data-testid="import-csv-preview">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Card</Table.Th>
                    <Table.Th>Set</Table.Th>
                    <Table.Th>Language</Table.Th>
                    <Table.Th>Finish</Table.Th>
                    <Table.Th ta="right">Quantity</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preview.entries.slice(0, PREVIEW_ROW_LIMIT).map((entry) => (
                    <Table.Tr key={`${entry.lines[0]}`}>
                      <Table.Td>{entry.name}</Table.Td>
                      <Table.Td>
                        {entry.setCode} #{entry.collectorNumber}
                      </Table.Td>
                      <Table.Td>{scryfallLanguageLabel(entry.language)}</Table.Td>
                      <Table.Td>{finishLabelForFinish(entry.finish)}</Table.Td>
                      <Table.Td ta="right">
                        {entry.currentQuantity > 0 ? entry.currentQuantity : 'New'} →{' '}
                        {entry.newQuantity}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
            {preview.entries.length > PREVIEW_ROW_LIMIT && (
              <Text size="xs" c="dimmed">
                Showing the first {PREVIEW_ROW_LIMIT} of {preview.entries.length} cards. The import
                uses all of them.
              </Text>
            )}

            <Group justify="space-between">
              <Button variant="default" onClick={reset}>
                Start again
              </Button>
              <Button onClick={startImport} disabled={preview.entries.length === 0}>
                Import {preview.entries.length} {preview.entries.length === 1 ? 'card' : 'cards'}
              </Button>
            </Group>
          </>
        )}

        {step === 'done' && summary && (
          <>
            <Text data-testid="import-csv-summary">
              {summary.added} added, {summary.updated} updated, {summary.skipped} skipped,{' '}
              {summary.failed} failed. {summary.copiesAdded} copies added.
            </Text>
            {summary.errors.length > 0 && <RowErrors errors={summary.errors} />}
            <Group justify="flex-end">
              <Button onClick={close}>Close</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}

function RowErrors({ errors }: { errors: ImportPreviewResult['errors'] }) {
  return (
    <Alert color="yellow" title="Rows with errors" data-testid="import-csv-row-errors">
      <ScrollArea.Autosize mah={160}>
        <List size="sm" spacing={2}>
          {errors.map((e) => (
            <List.Item key={`${e.line}:${e.reason}`}>
              Line {e.line}: {e.reason}
            </List.Item>
          ))}
        </List>
      </ScrollArea.Autosize>
    </Alert>
  );
}
