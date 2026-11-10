import { Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { Logo } from '../Logo';
import { CardFan } from './CardFan';
import classes from './PublicPage.module.css';

export function PublicPage({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={classes.page}>
      <aside className={classes.stage}>
        <div className={classes.fanWrap}>
          <CardFan replayOnHover />
        </div>
        <div className={classes.pitch}>
          <p className={classes.pitchTitle}>Know what your collection is worth</p>
          <p className={classes.pitchText}>
            Live Scryfall prices, daily price history and totals in your own currency.
          </p>
        </div>
      </aside>

      <main className={classes.formSide}>
        <Stack gap="xl" className={classes.formInner}>
          <Logo size={30} animated={false} />
          <Stack gap={4}>
            <Title order={1} fz={32}>
              {title}
            </Title>
            {subtitle ? <Text className={classes.subtitle}>{subtitle}</Text> : null}
          </Stack>
          {children}
        </Stack>
      </main>
    </div>
  );
}
