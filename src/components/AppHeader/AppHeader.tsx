'use client';

import { Box, Group } from '@mantine/core';
import { routes } from '@/routes';
import { Logo } from '../Logo';
import classes from './AppHeader.module.css';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader() {
  return (
    <Box component="header" className={classes.header}>
      <Group justify="space-between" h="100%" wrap="nowrap">
        <a href={routes.collection} className={classes.logoLink} aria-label="bindrr home">
          <Logo w={160} />
        </a>

        <Group gap="md" wrap="nowrap">
          <ThemeToggle />
          <a href={routes.logout} className={classes.logoutLink}>
            Logout
          </a>
        </Group>
      </Group>
    </Box>
  );
}
