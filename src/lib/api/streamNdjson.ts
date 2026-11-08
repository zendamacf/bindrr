/**
 * Makes a streaming response in the NDJSON format: one JSON object on each line.
 * The handler sends events with `send`. If the handler throws, the stream
 * sends one `{ type: 'error' }` event and then closes.
 */
export function streamNdjson<TEvent extends { type: string }>(
  handler: (send: (event: TEvent) => void) => Promise<void>,
  options?: { onError?: (error: unknown) => void },
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TEvent | { type: 'error'; message: string }) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await handler(send);
      } catch (error) {
        options?.onError?.(error);
        send({ type: 'error', message: 'The import failed. Try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
