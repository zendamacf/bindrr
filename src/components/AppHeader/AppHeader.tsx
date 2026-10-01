'use client';

import { Box, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { routes } from '@/routes';
import type { AuthUser } from '@/utils/auth/types';
import { CurrencySelect } from '../Currency';
import { Logo } from '../Logo';
import { AccountMenu } from './AccountMenu';
import classes from './AppHeader.module.css';
import { ThemeToggle } from './ThemeToggle';

type AppHeaderProps = {
  user: AuthUser;
};

export function AppHeader({ user }: AppHeaderProps) {
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
          <AccountMenu user={user} />
        </Group>
      </Group>
    </Box>
  );
}
