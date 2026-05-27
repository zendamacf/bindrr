'use client';

import { Badge, Tooltip } from '@mantine/core';
import type { PriceTrend } from '@/lib/collection/priceTrend';
import { COLLECTION_EDIT_TOOLTIP_Z_INDEX } from './collectionEditZIndex';

function formatSignedPercent(changePercent: number): string {
  const fixed = changePercent.toFixed(1);
  return changePercent > 0 ? `+${fixed}%` : `${fixed}%`;
}

export function PriceTrendBadge({
  trend,
  size = 'xs',
}: {
  trend: PriceTrend;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const changePercent = trend.changePercent;
  const hasValue = changePercent != null && trend.hasHistory;

  const tooltipLabel = `Price change over the last ${trend.windowDays} days`;

  let badgeColor: 'gray' | 'green' | 'red' = 'gray';
  let label = '—';

  if (hasValue) {
    badgeColor = changePercent > 0 ? 'green' : changePercent < 0 ? 'red' : 'gray';
    label = formatSignedPercent(changePercent);
  }

  return (
    <Tooltip label={tooltipLabel} withArrow withinPortal zIndex={COLLECTION_EDIT_TOOLTIP_Z_INDEX}>
      <Badge size={size} variant="light" color={badgeColor}>
        {label}
      </Badge>
    </Tooltip>
  );
}
