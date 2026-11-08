import { NextResponse } from 'next/server';
import { logApiError } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { streamNdjson } from '@/lib/api/streamNdjson';
import { buildImportPlan, toPreviewEntry } from '@/lib/collection/csv/buildImportPlan';
import type { ImportPreviewEvent } from '@/lib/collection/csv/types';
import { readCsvBody } from '../readCsvBody';

const ROUTE = '/api/collection/import/preview';

export async function POST(request: Request) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await readCsvBody(request);
  if ('response' in body) return body.response;

  return streamNdjson<ImportPreviewEvent>(
    async (send) => {
      const plan = await buildImportPlan(body.csv, user.id, undefined, (progress) =>
        send({ type: 'progress', ...progress }),
      );
      send({
        type: 'result',
        result: {
          fatal: plan.fatal,
          rowCount: plan.rowCount,
          entries: plan.entries.map(toPreviewEntry),
          errors: plan.errors,
        },
      });
    },
    { onError: (error) => logApiError(error, { route: ROUTE, method: 'POST', userId: user.id }) },
  );
}
