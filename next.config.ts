import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import { routes } from './src/routes';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cards.scryfall.io',
        pathname: '/**',
      },
    ],
  },
};

const isDev = process.env.NODE_ENV === 'development';

const sentryBuildOptions = {
  org: 'kalopsiadev',
  project: 'bindrr',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: routes.monitoring,
  disableLogger: true,
  automaticVercelMonitors: true,
} as const;

export default isDev ? nextConfig : withSentryConfig(nextConfig, sentryBuildOptions);
