import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import { routes } from './src/routes';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cards.scryfall.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'svgs.scryfall.io',
        pathname: '/**',
      },
    ],
  },
};

const isDev = process.env.NODE_ENV === 'development';
const isDockerBuild = process.env.DOCKER_BUILD === '1';

const sentryBuildOptions = {
  org: 'kalopsiadev',
  project: 'bindrr',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: routes.monitoring,
  disableLogger: true,
  automaticVercelMonitors: false,
} as const;

export default isDev || isDockerBuild
  ? nextConfig
  : withSentryConfig(nextConfig, sentryBuildOptions);
