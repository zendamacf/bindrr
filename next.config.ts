import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'kalopsiadev',
  project: 'bindrr',
  silent: !process.env.CI,
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: '/monitoring',
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  automaticVercelMonitors: true,
});
