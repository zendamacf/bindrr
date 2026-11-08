/**
 * Makes a streaming response in the NDJSON format: one JSON object on each line.
 * The handler sends events with `send`. If the client closes the connection,
 * `send` does nothing and the handler keeps running to the end.
 * If the handler throws, the stream sends one `{ type: 'error' }` event and then closes.
 */
export function streamNdjson<TEvent extends { type: string }>(
  handler: (send: (event: TEvent) => void) => Promise<void>,
  options?: { onError?: (error: unknown) => void },
): Response {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TEvent | { type: 'error'; message: string }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      try {
        await handler(send);
      } catch (error) {
        options?.onError?.(error);
        send({ type: 'error', message: 'The import failed. Try again.' });
      } finally {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
