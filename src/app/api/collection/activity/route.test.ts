import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const getCollectionActivity = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollectionActivity', () => ({ getCollectionActivity }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(url: string) {
  return new Request(`http://localhost${url}`);
}

describe('GET /api/collection/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.collectionActivity));

    expect(response.status).toBe(401);
  });

  it('returns activity for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 9, email: 'a@b.com' });
    getCollectionActivity.mockResolvedValue({
      entries: [],
      count: 0,
      total: 0,
    });

    const { GET } = await import('./route');
    const response = await GET(
      request(
        `${apiRoutes.collectionActivity}?page=2&filter_search=bolt&filter_set=4&filter_from=2024-01-01&filter_to=2024-12-31`,
      ),
    );

    expect(response.status).toBe(200);
    expect(getCollectionActivity).toHaveBeenCalledWith({
      userId: 9,
      page: 2,
      filterSearch: 'bolt',
      filterSet: 4,
      filterFrom: '2024-01-01',
      filterTo: '2024-12-31',
    });
  });

  it('ignores invalid page query values', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollectionActivity.mockResolvedValue({
      entries: [],
      count: 0,
      total: 0,
    });

    const { GET } = await import('./route');
    await GET(request(`${apiRoutes.collectionActivity}?page=0&filter_set=not-a-number`));

    expect(getCollectionActivity).toHaveBeenCalledWith({
      userId: 1,
      page: undefined,
      filterSearch: undefined,
      filterSet: undefined,
      filterFrom: undefined,
      filterTo: undefined,
    });
  });

  it('returns 500 when loading fails', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollectionActivity.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.collectionActivity));

    expect(response.status).toBe(500);
    expect(logApiError).toHaveBeenCalled();
  });
});
