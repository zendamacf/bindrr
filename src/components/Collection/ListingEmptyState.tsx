import { Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import classes from './Listing.module.css';

export function ListingEmptyState({
  title,
  text,
  action,
  testId,
}: {
  title: string;
  text: string;
  action: ReactNode;
  testId?: string;
}) {
  return (
    <Stack align="center" gap="xs" py={64} data-testid={testId}>
      <Text className={classes.emptyTitle}>{title}</Text>
      <Text c="dimmed" size="sm" ta="center" maw={360}>
        {text}
      </Text>
      {action}
    </Stack>
  );
}
