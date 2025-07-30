import '@mantine/core/styles.css';

import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const theme = createTheme({
  cursorType: 'pointer',
  primaryColor: 'violet',
  colors: {
    violet: [
      '#f5effa',
      '#e6dcef',
      '#cdb5e1',
      '#b28bd3',
      '#9c68c7',
      '#8e52c1',
      '#8747be',
      '#7439a8',
      '#673296',
      '#5b2a86', // Theme color
    ],
    green: [
      '#effce9',
      '#e2f5d8',
      '#c4e9b2',
      '#a4dc88',
      '#89d165',
      '#78ca4f',
      '#6fc742',
      '#5eb234', // Theme color
      '#509c2b',
      '#41871f',
    ],
    orange: [
      '#fff8e2',
      '#fcefcf',
      '#f6dda3',
      '#f0cb72',
      '#ebbb4a',
      '#e8b130', // Theme color
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
      '#c91d2b', // Theme color
      '#b21525',
      '#9c071d',
    ],
    gray: [
      '#ecf7fd',
      '#e3e8ec',
      '#c8cdd0', // Theme color
      '#adb3b7',
      '#959ca0',
      '#858d92',
      '#7c868d',
      '#69747a',
      '#5a676f',
      '#485a64',
    ],
    dark: [
      '#f3f5f7',
      '#e8e8e8',
      '#cccfd0',
      '#adb5b9',
      '#929fa5',
      '#81919a',
      '#778a95',
      '#657781',
      '#576a74',
      '#1f292e', // Theme color
    ],
  },
});

const font = Inter({
  subsets: ['latin'],
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
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={font.className}>
        <MantineProvider theme={theme}>{children}</MantineProvider>
        <Analytics />
      </body>
    </html>
  );
}
