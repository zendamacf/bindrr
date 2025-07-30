import { login } from '@/actions/auth/actions';
import { PublicPage } from '@/components/Page/PublicPage';
import { guardUser } from '@/utils/auth/guardUser';
import { Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function Login() {
  const user = await guardUser();
  if (user) redirect('/');

  return (
    <PublicPage
      title={'Welcome back!'}
      subtitle={
        <>
          Do not have an account yet? <Anchor href={'/signup'}>Create an account</Anchor>
        </>
      }
    >
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
        <Group justify="space-between" mt="lg">
          <Anchor size="sm" href={'/forgot-password'}>
            Forgot password?
          </Anchor>
        </Group>
        <Button type={'submit'} fullWidth mt="xl" radius="md">
          Login
        </Button>
      </form>
    </PublicPage>
  );
}
