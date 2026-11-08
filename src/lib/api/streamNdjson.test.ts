import { describe, expect, it, vi } from 'vitest';
import { streamNdjson } from './streamNdjson';

type Event = { type: 'progress' | 'result'; n: number };

async function readAll(response: Response) {
  return (await response.text())
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

describe('streamNdjson', () => {
  it('sends one JSON object on each line', async () => {
    const response = streamNdjson<Event>(async (send) => {
      send({ type: 'progress', n: 1 });
      send({ type: 'result', n: 2 });
    });

    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    expect(await readAll(response)).toEqual([
      { type: 'progress', n: 1 },
      { type: 'result', n: 2 },
    ]);
  });

  it('sends an error event and calls onError when the handler throws', async () => {
    const onError = vi.fn();
    const response = streamNdjson<Event>(
      async () => {
        throw new Error('boom');
      },
      { onError },
    );

    expect(await readAll(response)).toEqual([
      { type: 'error', message: 'The import failed. Try again.' },
    ]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('keeps running to the end after the client closes the connection', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const steps: string[] = [];
    const finished = new Promise<void>((resolve) => {
      const response = streamNdjson<Event>(async (send) => {
        send({ type: 'progress', n: 1 });
        await gate;
        send({ type: 'progress', n: 2 });
        steps.push('saved');
        resolve();
      });

      void response.body?.cancel();
    });

    release();
    await finished;

    expect(steps).toEqual(['saved']);
  });

  it('does not report an error when the client closed the connection', async () => {
    const onError = vi.fn();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const done = new Promise<void>((resolve) => {
      const response = streamNdjson<Event>(
        async (send) => {
          await gate;
          send({ type: 'result', n: 1 });
          resolve();
        },
        { onError },
      );
      void response.body?.cancel();
    });

    release();
    await done;

    expect(onError).not.toHaveBeenCalled();
  });
});
