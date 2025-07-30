import { signup } from '@/actions/auth/actions';
import { PublicPage } from '@/components/Page';
import { guardUser } from '@/utils/auth/guardUser';
import { Anchor, Button, PasswordInput, TextInput } from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const user = await guardUser();
  if (user) redirect('/');

  return (
    <PublicPage
      title={'Sign Up'}
      subtitle={
        <>
          Already have an account? <Anchor href={'/login'}>Sign In</Anchor>
        </>
      }
    >
      <form action={signup}>
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
        <Button type="submit" fullWidth mt="xl" radius="md">
          Sign Up
        </Button>
      </form>
    </PublicPage>
  );
}
