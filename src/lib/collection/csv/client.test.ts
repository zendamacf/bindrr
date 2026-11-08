import { describe, expect, it, vi } from 'vitest';
import { previewCollectionImport, readNdjson, SIGN_IN_AGAIN_MESSAGE } from './client';

const apiFetch = vi.fn();
vi.mock('@/lib/api/fetch', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe('readNdjson', () => {
  it('reads one event on each line', async () => {
    const onEvent = vi.fn();
    await readNdjson(streamOf(['{"a":1}\n{"a":2}\n']), onEvent);
    expect(onEvent.mock.calls).toEqual([[{ a: 1 }], [{ a: 2 }]]);
  });

  it('joins lines that are split between chunks', async () => {
    const onEvent = vi.fn();
    await readNdjson(streamOf(['{"a":', '1}\n{"a"', ':2}']), onEvent);
    expect(onEvent.mock.calls).toEqual([[{ a: 1 }], [{ a: 2 }]]);
  });

  it('ignores blank lines', async () => {
    const onEvent = vi.fn();
    await readNdjson(streamOf(['\n{"a":1}\n\n']), onEvent);
    expect(onEvent).toHaveBeenCalledTimes(1);
  });
});

describe('previewCollectionImport', () => {
  const ndjson = (lines: unknown[]) =>
    new Response(lines.map((line) => `${JSON.stringify(line)}\n`).join(''), {
      headers: { 'content-type': 'application/x-ndjson; charset=utf-8' },
    });

  it('sends progress to the callback and returns the result', async () => {
    const result = { fatal: null, rowCount: 1, entries: [], errors: [] };
    apiFetch.mockResolvedValue(
      ndjson([
        { type: 'progress', stage: 'lookup', done: 1, total: 2 },
        { type: 'result', result },
      ]),
    );
    const onProgress = vi.fn();

    await expect(previewCollectionImport('csv', onProgress)).resolves.toEqual(result);
    expect(onProgress).toHaveBeenCalledWith({ stage: 'lookup', done: 1, total: 2 });
  });

  it('asks the user to sign in again when the response is the login page', async () => {
    apiFetch.mockResolvedValue(
      new Response('<html>Login</html>', { headers: { 'content-type': 'text/html' } }),
    );
    await expect(previewCollectionImport('csv', vi.fn())).rejects.toThrow(SIGN_IN_AGAIN_MESSAGE);
  });

  it('asks the user to sign in again for HTTP 401', async () => {
    apiFetch.mockResolvedValue(Response.json({ error: 'Unauthorized' }, { status: 401 }));
    await expect(previewCollectionImport('csv', vi.fn())).rejects.toThrow(SIGN_IN_AGAIN_MESSAGE);
  });

  it('shows the error from the server for other failures', async () => {
    apiFetch.mockResolvedValue(Response.json({ error: 'The file is too large' }, { status: 413 }));
    await expect(previewCollectionImport('csv', vi.fn())).rejects.toThrow('The file is too large');
  });

  it('throws the message from an error event', async () => {
    apiFetch.mockResolvedValue(
      ndjson([{ type: 'error', message: 'The import failed. Try again.' }]),
    );
    await expect(previewCollectionImport('csv', vi.fn())).rejects.toThrow(
      'The import failed. Try again.',
    );
  });
});
