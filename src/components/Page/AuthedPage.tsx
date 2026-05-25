import { Container, Space } from '@mantine/core';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import { guardUser } from '@/utils/auth/guardUser';
import type { AuthUser } from '@/utils/auth/types';
import { SiteHeader } from '../SiteHeader';

export async function AuthedPage({
  children: Child,
}: {
  children: ComponentType<{ user: AuthUser }>;
}) {
  const user = await guardUser();
  if (!user) redirect('/login');

  return (
    <div>
      <main>
        <SiteHeader />
        <Container fluid>
          <Child user={user} />
          <Space style={{ height: '100px' }} />
        </Container>
      </main>
    </div>
  );
}
