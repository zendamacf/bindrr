import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const buildImportPlan = vi.fn();
const commitImportPlan = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/csv/buildImportPlan', () => ({ buildImportPlan }));
vi.mock('@/lib/collection/csv/commitImport', () => ({ commitImportPlan }));

function request(body: unknown) {
  return new Request(`http://localhost${apiRoutes.collectionImport}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function readEvents(response: Response) {
  return (await response.text())
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

describe('POST /api/collection/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);
    const { POST } = await import('./route');

    expect((await POST(request({ csv: 'a' }))).status).toBe(401);
    expect(commitImportPlan).not.toHaveBeenCalled();
  });

  it('returns 400 when csv is missing', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    const { POST } = await import('./route');

    expect((await POST(request({}))).status).toBe(400);
  });

  it('does not save anything when the file cannot be read', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    buildImportPlan.mockResolvedValue({ fatal: 'The file is empty.', entries: [], errors: [] });
    const { POST } = await import('./route');

    const events = await readEvents(await POST(request({ csv: 'x' })));

    expect(commitImportPlan).not.toHaveBeenCalled();
    expect(events).toEqual([{ type: 'result', fatal: 'The file is empty.', summary: null }]);
  });

  it('saves the plan for the signed-in user and streams the summary', async () => {
    getSession.mockResolvedValue({ id: 9, email: 'a@b.com' });
    const plan = { fatal: null, entries: [{}], errors: [] };
    const summary = { added: 1, updated: 0, skipped: 0, failed: 0, copiesAdded: 2, errors: [] };
    buildImportPlan.mockResolvedValue(plan);
    commitImportPlan.mockImplementation(async (_plan, _userId, onProgress) => {
      onProgress({ stage: 'commit', done: 1, total: 1 });
      return summary;
    });
    const { POST } = await import('./route');

    const events = await readEvents(await POST(request({ csv: 'x' })));

    expect(commitImportPlan).toHaveBeenCalledWith(plan, 9, expect.any(Function));
    expect(events).toEqual([
      { type: 'progress', stage: 'commit', done: 1, total: 1 },
      { type: 'result', fatal: null, summary },
    ]);
  });
});
