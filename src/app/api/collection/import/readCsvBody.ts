import { NextResponse } from 'next/server';
import { IMPORT_MAX_BYTES } from '@/lib/collection/csv/parseImportRows';

/** Reads the `csv` text from a JSON request body. Returns a response if the body is not valid. */
export async function readCsvBody(
  request: Request,
): Promise<{ csv: string } | { response: NextResponse }> {
  let body: { csv?: unknown };
  try {
    body = (await request.json()) as { csv?: unknown };
  } catch {
    return { response: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) };
  }

  if (typeof body.csv !== 'string' || body.csv.trim() === '') {
    return { response: NextResponse.json({ error: 'Missing csv' }, { status: 400 }) };
  }

  if (new TextEncoder().encode(body.csv).length > IMPORT_MAX_BYTES) {
    return { response: NextResponse.json({ error: 'The file is too large' }, { status: 413 }) };
  }

  return { csv: body.csv };
}
