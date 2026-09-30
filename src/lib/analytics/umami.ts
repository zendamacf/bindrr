export type UmamiConfig = {
  websiteId: string;
  scriptUrl: string;
};

/** Resolves Umami page-view tracking from env; returns null when disabled or invalid. */
export function getUmamiConfig(env: {
  PUBLIC_UMAMI_WEBSITE_ID?: string;
  PUBLIC_UMAMI_SCRIPT_URL?: string;
}): UmamiConfig | null {
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID?.trim();
  const scriptUrl = env.PUBLIC_UMAMI_SCRIPT_URL?.trim();
  if (!websiteId || !scriptUrl) return null;

  try {
    const url = new URL(scriptUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  } catch {
    return null;
  }

  return { websiteId, scriptUrl };
}
