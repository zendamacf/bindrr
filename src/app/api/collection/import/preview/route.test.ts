import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const buildImportPlan = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/csv/buildImportPlan', async () => {
  const actual = await vi.importActual<typeof import('@/lib/collection/csv/buildImportPlan')>(
    '@/lib/collection/csv/buildImportPlan',
  );
  return { ...actual, buildImportPlan };
});
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/collection/csv/findStoredPrintings', () => ({ findStoredPrintings: vi.fn() }));

function request(body: unknown) {
  return new Request(`http://localhost${apiRoutes.collectionImportPreview}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function readEvents(response: Response) {
  const text = await response.text();
  return text
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

describe('POST /api/collection/import/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);
    const { POST } = await import('./route');

    const response = await POST(request({ csv: 'a' }));

    expect(response.status).toBe(401);
    expect(buildImportPlan).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON and for a missing csv', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    const { POST } = await import('./route');

    expect((await POST(request('{'))).status).toBe(400);
    expect((await POST(request({}))).status).toBe(400);
    expect((await POST(request({ csv: '  ' }))).status).toBe(400);
  });

  it('returns 413 when the file is too large', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    const { POST } = await import('./route');

    const response = await POST(request({ csv: 'a'.repeat(5 * 1024 * 1024 + 1) }));

    expect(response.status).toBe(413);
  });

  it('streams progress events and then the preview result', async () => {
    getSession.mockResolvedValue({ id: 5, email: 'a@b.com' });
    buildImportPlan.mockImplementation(async (_csv, _userId, _deps, onProgress) => {
      onProgress({ stage: 'lookup', done: 1, total: 2 });
      return {
        fatal: null,
        rowCount: 3,
        errors: [{ line: 4, reason: 'Card not found' }],
        entries: [
          {
            printing: {
              name: 'Sol Ring',
              setCode: 'LEA',
              collectorNumber: '232',
              language: 'en',
              card: { huge: 'object that must not be sent' },
            },
            finish: 'foil',
            lines: [2, 3],
            quantityToAdd: 3,
            currentQuantity: 2,
            newQuantity: 5,
          },
        ],
      };
    });
    const { POST } = await import('./route');

    const response = await POST(request({ csv: 'set,collector_number,quantity\nlea,232,3' }));
    const events = await readEvents(response);

    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    expect(buildImportPlan).toHaveBeenCalledWith(
      expect.any(String),
      5,
      undefined,
      expect.any(Function),
    );
    expect(events[0]).toEqual({ type: 'progress', stage: 'lookup', done: 1, total: 2 });
    expect(events[1]).toEqual({
      type: 'result',
      result: {
        fatal: null,
        rowCount: 3,
        errors: [{ line: 4, reason: 'Card not found' }],
        entries: [
          {
            lines: [2, 3],
            name: 'Sol Ring',
            setCode: 'LEA',
            collectorNumber: '232',
            language: 'en',
            finish: 'foil',
            quantityToAdd: 3,
            currentQuantity: 2,
            newQuantity: 5,
          },
        ],
      },
    });
  });

  it('sends an error event when the import fails', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    buildImportPlan.mockRejectedValue(new Error('Scryfall down'));
    const { POST } = await import('./route');

    const events = await readEvents(await POST(request({ csv: 'a' })));

    expect(events).toEqual([{ type: 'error', message: 'The import failed. Try again.' }]);
  });
});
