import { login } from '@/actions/auth/actions';
import { PublicPage } from '@/components/Page/PublicPage';
import { guardUser } from '@/utils/auth/guardUser';
import { Button, PasswordInput, TextInput } from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function Login() {
  const user = await guardUser();
  if (user) redirect('/');

  return (
    <PublicPage title={'Welcome back!'} subtitle={null}>
      <form action={login}>
        <TextInput
          label="Email"
          name="email"
          placeholder="email@example.com"
          required
          radius="md"
        />
        <PasswordInput
          label="Password"
          name="password"
          placeholder="Your password"
          required
          mt="md"
          radius="md"
        />
        <Button type={'submit'} fullWidth mt="xl" radius="md">
          Login
        </Button>
      </form>
    </PublicPage>
  );
}
