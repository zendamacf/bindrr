import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

const isDev = process.env.NODE_ENV === 'development';

const sentryBuildOptions = {
  org: 'kalopsiadev',
  project: 'bindrr',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,
} as const;

export default isDev ? nextConfig : withSentryConfig(nextConfig, sentryBuildOptions);
