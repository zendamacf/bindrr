import { describe, expect, it, vi } from 'vitest';
import { readNdjson } from './client';

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
