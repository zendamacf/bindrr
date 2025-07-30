import { guardUser } from '@/utils/auth/guardUser';
import { SupabaseSafeUser } from '@/utils/supabase/safeSession';
import { Container, Space } from '@mantine/core';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';
import { SiteHeader } from '../SiteHeader';

export async function AuthedPage({
  children: Child,
}: {
  children: ComponentType<{ user: SupabaseSafeUser }>;
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
