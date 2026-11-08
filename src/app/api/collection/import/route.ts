import { NextResponse } from 'next/server';
import { logApiError } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { streamNdjson } from '@/lib/api/streamNdjson';
import { buildImportPlan, type ImportProgress } from '@/lib/collection/csv/buildImportPlan';
import { commitImportPlan } from '@/lib/collection/csv/commitImport';
import type { ImportCommitEvent } from '@/lib/collection/csv/types';
import { readCsvBody } from './readCsvBody';

const ROUTE = '/api/collection/import';

export async function POST(request: Request) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await readCsvBody(request);
  if ('response' in body) return body.response;

  return streamNdjson<ImportCommitEvent>(
    async (send) => {
      const onProgress = (progress: ImportProgress) => send({ type: 'progress', ...progress });

      const plan = await buildImportPlan(body.csv, user.id, undefined, onProgress);
      if (plan.fatal) {
        send({ type: 'result', fatal: plan.fatal, summary: null });
        return;
      }

      const summary = await commitImportPlan(plan, user.id, onProgress);
      send({ type: 'result', fatal: null, summary });
    },
    { onError: (error) => logApiError(error, { route: ROUTE, method: 'POST', userId: user.id }) },
  );
}
