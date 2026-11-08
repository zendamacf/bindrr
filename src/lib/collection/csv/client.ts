import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/routes';
import type {
  ImportCommitEvent,
  ImportPreviewEvent,
  ImportPreviewResult,
  ImportStage,
  ImportSummaryResult,
} from './types';

export const SIGN_IN_AGAIN_MESSAGE = 'Your session has ended. Sign in again, then try again.';

export type ImportProgressUpdate = { stage: ImportStage; done: number; total: number };

/** Reads an NDJSON response and calls `onEvent` for each line. */
export async function readNdjson<TEvent>(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: TEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const flushLine = (line: string) => {
    if (line.trim() !== '') onEvent(JSON.parse(line) as TEvent);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) flushLine(line);
  }

  buffer += decoder.decode();
  flushLine(buffer);
}

async function postImport<TResult>(
  url: string,
  csv: string,
  onProgress: (progress: ImportProgressUpdate) => void,
  pickResult: (event: { type: string }) => TResult | null,
  signal?: AbortSignal,
): Promise<TResult> {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ csv }),
    signal,
  });

  if (res.status === 401) throw new Error(SIGN_IN_AGAIN_MESSAGE);

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'The import failed. Try again.');
  }

  // When the session has ended, the middleware sends the login page (HTML) and not a stream.
  if (!(res.headers.get('content-type') ?? '').includes('application/x-ndjson')) {
    throw new Error(SIGN_IN_AGAIN_MESSAGE);
  }

  let result: TResult | null = null;
  let failure: string | null = null;

  await readNdjson<{ type: string; message?: string } & ImportProgressUpdate>(res.body, (event) => {
    if (event.type === 'progress') {
      onProgress({ stage: event.stage, done: event.done, total: event.total });
    } else if (event.type === 'error') {
      failure = event.message ?? 'The import failed. Try again.';
    } else {
      result = pickResult(event);
    }
  });

  if (failure) throw new Error(failure);
  if (!result) throw new Error('The import ended before it finished. Try again.');
  return result;
}

export function previewCollectionImport(
  csv: string,
  onProgress: (progress: ImportProgressUpdate) => void,
  signal?: AbortSignal,
): Promise<ImportPreviewResult> {
  return postImport(
    apiRoutes.collectionImportPreview,
    csv,
    onProgress,
    (event) => (event as ImportPreviewEvent & { type: 'result' }).result,
    signal,
  );
}

export function commitCollectionImport(
  csv: string,
  onProgress: (progress: ImportProgressUpdate) => void,
  signal?: AbortSignal,
): Promise<ImportSummaryResult> {
  return postImport(
    apiRoutes.collectionImport,
    csv,
    onProgress,
    (event) => {
      const { fatal, summary } = event as ImportCommitEvent & { type: 'result' };
      if (fatal || !summary) throw new Error(fatal ?? 'The import failed. Try again.');
      return summary;
    },
    signal,
  );
}
