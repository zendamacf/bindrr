'use client';

import { Avatar, Menu, UnstyledButton } from '@mantine/core';
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/ClockCounterClockwise';
import { SignOutIcon } from '@phosphor-icons/react/SignOut';
import { umamiEvents } from '@/lib/analytics/umamiEvents';
import { routes } from '@/routes';
import type { AuthUser } from '@/utils/auth/types';
import { initialsFromEmail } from '@/utils/emailInitials';
import classes from './AppHeader.module.css';

type AccountMenuProps = {
  user: AuthUser;
};

export function AccountMenu({ user }: AccountMenuProps) {
  const initials = initialsFromEmail(user.email);

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton className={classes.accountButton} aria-label="Account menu">
          <Avatar radius="xl" size={32} color="violet">
            {initials}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{user.email}</Menu.Label>
        <Menu.Item
          component="a"
          href={routes.collectionActivity}
          leftSection={<ClockCounterClockwiseIcon size={16} />}
        >
          Collection activity
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          component="a"
          href={routes.logout}
          leftSection={<SignOutIcon size={16} />}
          data-umami-event={umamiEvents.logout}
        >
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
