export type UmamiEventData = Record<string, string | number | boolean>;

export type UmamiTracker = {
  track: (event: string, data?: UmamiEventData) => void;
};

/** Keeps only Umami-safe scalar event properties. */
export function sanitizeUmamiEventData(
  data: Record<string, unknown> | undefined,
): UmamiEventData | undefined {
  if (!data) return undefined;
  const out: UmamiEventData = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Calls `umami.track` when the tracker is present; safe to use from client code. */
export function invokeUmamiTrack(
  tracker: UmamiTracker | undefined,
  name: string,
  data?: Record<string, unknown>,
): void {
  if (!tracker?.track) return;
  const payload = sanitizeUmamiEventData(data);
  try {
    if (payload) {
      tracker.track(name, payload);
    } else {
      tracker.track(name);
    }
  } catch {
    // Analytics must not break the app.
  }
}
