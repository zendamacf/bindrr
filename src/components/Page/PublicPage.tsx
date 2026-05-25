import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { Logo } from '../Logo';
import classes from './PublicPage.module.css';

export function PublicPage({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container size={420} my={40}>
      <Stack gap={80}>
        <Logo />
        <Title ta="center" className={classes.title}>
          {title}
        </Title>
      </Stack>

      <Text className={classes.subtitle}>{subtitle}</Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        {children}
      </Paper>
    </Container>
  );
}
