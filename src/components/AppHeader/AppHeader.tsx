'use client';

import { Box, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { usePathname } from 'next/navigation';
import { routes } from '@/routes';
import type { AuthUser } from '@/utils/auth/types';
import { CurrencySelect } from '../Currency';
import { Logo } from '../Logo';
import { AccountMenu } from './AccountMenu';
import classes from './AppHeader.module.css';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: routes.collection, label: 'Collection' },
  { href: routes.wishlist, label: 'Wishlist' },
  { href: routes.analytics, label: 'Analytics' },
] as const;

type AppHeaderProps = {
  user: AuthUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 48.75rem)', true);
  const pathname = usePathname();

  return (
    <Box component="header" className={classes.header}>
      <a href={routes.collection} className={classes.logoLink} aria-label="bindrr home">
        <Logo size={isMobile ? 26 : 30} />
      </a>

      <nav className={classes.nav} aria-label="Main">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={active ? classes.navLinkActive : classes.navLink}
              aria-current={active ? 'page' : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      <Group gap={isMobile ? 'xs' : 'md'} wrap="nowrap" className={classes.actions}>
        <CurrencySelect />
        <ThemeToggle />
        <AccountMenu user={user} />
      </Group>
    </Box>
  );
}
