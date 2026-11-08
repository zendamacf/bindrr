import { describe, expect, it } from 'vitest';
import { IMPORT_MAX_BODY_BYTES, readCsvBody } from './readCsvBody';

function request(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/collection/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

describe('readCsvBody', () => {
  it('returns the csv text', async () => {
    const result = await readCsvBody(request(JSON.stringify({ csv: 'a,b\n1,2' })));
    expect(result).toEqual({ csv: 'a,b\n1,2' });
  });

  it('returns 400 for invalid JSON, null and a missing csv', async () => {
    for (const body of [
      '{',
      'null',
      '{}',
      JSON.stringify({ csv: '  ' }),
      JSON.stringify({ csv: 5 }),
    ]) {
      const result = await readCsvBody(request(body));
      expect('response' in result && result.response.status).toBe(400);
    }
  });

  it('returns 413 before it reads a body that declares a large size', async () => {
    const result = await readCsvBody(
      request('{}', { 'content-length': String(IMPORT_MAX_BODY_BYTES + 1) }),
    );
    expect('response' in result && result.response.status).toBe(413);
  });

  it('returns 413 when a body without a declared size is too large', async () => {
    const chunk = new Uint8Array(1024 * 1024).fill(97);
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunk);
        sent += chunk.byteLength;
        if (sent > IMPORT_MAX_BODY_BYTES * 3) controller.close();
      },
    });
    const req = new Request('http://localhost/api/collection/import', {
      method: 'POST',
      body: stream,
      // @ts-expect-error Node needs this option for a streamed body.
      duplex: 'half',
    });

    const result = await readCsvBody(req);

    expect('response' in result && result.response.status).toBe(413);
    expect(sent).toBeLessThan(IMPORT_MAX_BODY_BYTES * 2);
  });

  it('returns 413 when the csv text is more than 5 MB', async () => {
    const result = await readCsvBody(
      request(JSON.stringify({ csv: 'a'.repeat(5 * 1024 * 1024 + 1) })),
    );
    expect('response' in result && result.response.status).toBe(413);
  });
});
