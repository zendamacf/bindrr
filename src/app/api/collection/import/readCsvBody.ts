import { NextResponse } from 'next/server';
import { IMPORT_MAX_BYTES } from '@/lib/collection/csv/parseImportRows';

/**
 * The most bytes the request body can have. JSON escapes (for example `\n`) make the
 * body longer than the CSV text, so the limit is more than the limit for the CSV.
 */
export const IMPORT_MAX_BODY_BYTES = IMPORT_MAX_BYTES * 2 + 1024;

function tooLarge() {
  return NextResponse.json({ error: 'The file is too large' }, { status: 413 });
}

/** Reads the body as text. It stops when the body is more than the limit. */
async function readLimitedText(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > IMPORT_MAX_BODY_BYTES) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > IMPORT_MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

/** Reads the `csv` text from a JSON request body. Returns a response if the body is not valid. */
export async function readCsvBody(
  request: Request,
): Promise<{ csv: string } | { response: NextResponse }> {
  const text = await readLimitedText(request);
  if (text === null) return { response: tooLarge() };

  let body: { csv?: unknown };
  try {
    body = JSON.parse(text) as { csv?: unknown };
  } catch {
    return { response: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) };
  }

  if (typeof body?.csv !== 'string' || body.csv.trim() === '') {
    return { response: NextResponse.json({ error: 'Missing csv' }, { status: 400 }) };
  }

  if (new TextEncoder().encode(body.csv).length > IMPORT_MAX_BYTES) {
    return { response: tooLarge() };
  }

  return { csv: body.csv };
}
