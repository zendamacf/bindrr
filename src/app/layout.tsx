import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';

import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Metadata, Viewport } from 'next';
import { Gabarito, Hanken_Grotesk } from 'next/font/google';
import { QueryProvider } from '@/components/QueryProvider';
import { UmamiAnalytics } from '@/components/UmamiAnalytics';
import './globals.css';

const theme = createTheme({
  cursorType: 'pointer',
  primaryColor: 'violet',
  primaryShade: { light: 9, dark: 4 },
  defaultRadius: 'md',
  fontFamily: 'var(--font-body), system-ui, sans-serif',
  headings: {
    fontFamily: 'var(--font-display), var(--font-body), system-ui, sans-serif',
    fontWeight: '600',
  },
  colors: {
    violet: [
      '#f5effa',
      '#e6dcef',
      '#cdb5e1',
      '#b28bd3',
      '#a374cc',
      '#8e52c1',
      '#7439a8',
      '#673296',
      '#5b2a86',
      '#4a2070',
    ],
    // Foil gold: prices and totals only.
    gold: [
      '#fff9e6',
      '#fdf0c4',
      '#f9e08a',
      '#f3cd52',
      '#e9b92f',
      '#d9a62b',
      '#b98a1c',
      '#946d14',
      '#70530f',
      '#4d390a',
    ],
    green: [
      '#effce9',
      '#e2f5d8',
      '#c4e9b2',
      '#a4dc88',
      '#89d165',
      '#78ca4f',
      '#6fc742',
      '#5eb234',
      '#509c2b',
      '#41871f',
    ],
    orange: [
      '#fff8e2',
      '#fcefcf',
      '#f6dda3',
      '#f0cb72',
      '#ebbb4a',
      '#e8b130',
      '#e7ac1f',
      '#cd9610',
      '#b68505',
      '#9e7200',
    ],
    red: [
      '#ffeaed',
      '#fcd5d8',
      '#f2a8ae',
      '#ea7982',
      '#e4515c',
      '#e03844',
      '#df2a38',
      '#c91d2b',
      '#b21525',
      '#9c071d',
    ],
    // Violet-tinted neutrals so greys sit comfortably beside the brand colour.
    gray: [
      '#f6f4f9',
      '#ece8f1',
      '#ddd7e5',
      '#c5bdd0',
      '#a79eb6',
      '#8a809b',
      '#6f6580',
      '#574e66',
      '#41394f',
      '#2d2738',
    ],
    // "Binder ink": dark surfaces. 7 = page, 6 = raised surfaces, 4 = borders.
    dark: [
      '#f3f0f7',
      '#e3deea',
      '#c7bfd2',
      '#a69cb4',
      '#40364f',
      '#352c43',
      '#2a2136',
      '#1b1524',
      '#150f1c',
      '#0f0b13',
    ],
  },
});

const display = Gabarito({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'bindrr',
  authors: {
    name: 'Zach Lang',
    url: 'https://github.com/zendamacf/',
  },
  appleWebApp: {
    title: 'bindrr',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <QueryProvider>
            <Notifications />
            {children}
          </QueryProvider>
        </MantineProvider>
        <UmamiAnalytics />
      </body>
    </html>
  );
}
