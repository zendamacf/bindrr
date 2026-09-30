import Script from 'next/script';
import { getUmamiConfig } from '@/lib/analytics/umami';

/** Optional Umami page views; enabled when `PUBLIC_UMAMI_*` env vars are set. */
export function UmamiAnalytics() {
  const config = getUmamiConfig({
    PUBLIC_UMAMI_WEBSITE_ID: process.env.PUBLIC_UMAMI_WEBSITE_ID,
    PUBLIC_UMAMI_SCRIPT_URL: process.env.PUBLIC_UMAMI_SCRIPT_URL,
  });
  if (!config) return null;

  return (
    <Script
      src={config.scriptUrl}
      data-website-id={config.websiteId}
      data-do-not-track="true"
      strategy="afterInteractive"
    />
  );
}
