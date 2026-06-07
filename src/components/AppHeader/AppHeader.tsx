'use client';

import { Box, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { SignOutIcon } from '@phosphor-icons/react/SignOut';
import { routes } from '@/routes';
import { CurrencySelect } from '../Currency';
import { Logo } from '../Logo';
import classes from './AppHeader.module.css';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader() {
  const isMobile = useMediaQuery('(max-width: 48.75rem)', true);

  return (
    <Box component="header" className={classes.header}>
      <Group justify="space-between" h="100%" wrap="nowrap" className={classes.headerInner}>
        <a href={routes.collection} className={classes.logoLink} aria-label="bindrr home">
          <Logo w={isMobile ? 96 : 160} />
        </a>

        <Group gap={isMobile ? 'xs' : 'md'} wrap="nowrap" className={classes.actions}>
          <CurrencySelect />
          <ThemeToggle />
          <a href={routes.logout} className={classes.logoutLink} aria-label="Logout">
            <Box hiddenFrom="sm" component="span" className={classes.logoutIcon}>
              <SignOutIcon size={18} />
            </Box>
            <Box visibleFrom="sm" component="span">
              Logout
            </Box>
          </a>
        </Group>
      </Group>
    </Box>
  );
}
