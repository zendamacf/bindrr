import { Container, Space } from '@mantine/core';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import { routes } from '@/routes';
import { getSession } from '@/utils/auth/session';
import type { AuthUser } from '@/utils/auth/types';
import { AppHeader } from '../AppHeader';
import { CurrencyProvider } from '../Currency';

export async function AuthedPage({
  children: Child,
}: {
  children: ComponentType<{ user: AuthUser }>;
}) {
  const user = await getSession();
  if (!user) redirect(routes.login);

  return (
    <CurrencyProvider>
      <div>
        <main>
          <AppHeader />
          <Container fluid>
            <Child user={user} />
            <Space style={{ height: '100px' }} />
          </Container>
        </main>
      </div>
    </CurrencyProvider>
  );
}
