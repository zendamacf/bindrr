'use client';

import { invokeUmamiTrack } from '@/lib/analytics/invokeUmamiTrack';
import type { UmamiEventName } from '@/lib/analytics/umamiEvents';

declare global {
  interface Window {
    umami?: import('@/lib/analytics/invokeUmamiTrack').UmamiTracker;
  }
}

/** Records a custom Umami event when analytics is configured and the script has loaded. */
export function trackUmamiEvent(name: UmamiEventName, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  invokeUmamiTrack(window.umami, name, data);
}
