'use client';

import { Button, PasswordInput, TextInput } from '@mantine/core';
import { useFormStatus } from 'react-dom';
import { login } from '@/actions/auth/actions';

function LoginFields() {
  const { pending } = useFormStatus();

  return (
    <>
      <TextInput
        label="Email"
        name="email"
        placeholder="email@example.com"
        required
        radius="md"
        disabled={pending}
      />
      <PasswordInput
        label="Password"
        name="password"
        placeholder="Your password"
        required
        mt="md"
        radius="md"
        disabled={pending}
      />
      <Button type="submit" fullWidth mt="xl" radius="md" loading={pending} disabled={pending}>
        Login
      </Button>
    </>
  );
}

export function LoginForm() {
  return (
    <form action={login}>
      <LoginFields />
    </form>
  );
}
