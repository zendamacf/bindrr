'use client';

import { Box, Burger, Divider, Drawer, Group, ScrollArea, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import classes from './SiteHeader.module.css';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const [drawerOpened, { toggle, close }] = useDisclosure(false);

  return (
    <Box pb={'lg'}>
      <MainNav drawerOpened={drawerOpened} toggleDrawer={toggle} />
      <MobileNav drawerOpened={drawerOpened} closeDrawer={close} />
    </Box>
  );
}

const links = [{ label: 'Collection', href: '/collection' }];

function MainNav({
  drawerOpened,
  toggleDrawer,
}: {
  drawerOpened: boolean;
  toggleDrawer: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className={classes.header}>
      <Group justify="space-between" h="100%">
        <a href={'/'}>
          <Logo w={160} />
        </a>

        <Group h="100%" gap={0} visibleFrom="sm">
          {links.map((link) => (
            <a
              href={link.href}
              className={classNames(classes.link, {
                [classes.active_link!]: pathname === link.href,
              })}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </Group>

        <Group h="100%" visibleFrom="sm">
          <ThemeToggle />
          <a href={'/auth/logout'} className={classes.link}>
            Logout
          </a>
        </Group>

        <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
      </Group>
    </header>
  );
}

function MobileNav({
  drawerOpened,
  closeDrawer,
}: {
  drawerOpened: boolean;
  closeDrawer: () => void;
}) {
  const pathname = usePathname();
  return (
    <Drawer
      opened={drawerOpened}
      onClose={closeDrawer}
      position={'right'}
      size="100%"
      padding="md"
      title={
        <a href={'/'}>
          <Logo w={180} />
        </a>
      }
      hiddenFrom="sm"
      zIndex={1000000}
    >
      <ScrollArea h="calc(100vh - 80px)" mx="-md">
        <Divider my="sm" />

        {links.map((link) => (
          <a
            href={link.href}
            className={classNames(classes.link, { [classes.active_link!]: pathname === link.href })}
            key={link.href}
          >
            {link.label}
          </a>
        ))}

        <Divider my="sm" />

        <Stack justify="center" px="md">
          <ThemeToggle />
          <a href={'/auth/logout'} className={classes.link} style={{ paddingLeft: 0 }}>
            Logout
          </a>
        </Stack>
      </ScrollArea>
    </Drawer>
  );
}
