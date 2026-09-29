'use client';

import { Button, PasswordInput, Text, TextInput } from '@mantine/core';
import { unstable_rethrow } from 'next/navigation';
import { useState } from 'react';
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
        data-testid="login-email"
      />
      <PasswordInput
        label="Password"
        name="password"
        placeholder="Your password"
        required
        mt="md"
        radius="md"
        disabled={pending}
        data-testid="login-password"
      />
      <Button
        type="submit"
        fullWidth
        mt="xl"
        radius="md"
        loading={pending}
        disabled={pending}
        data-testid="login-submit"
      >
        Login
      </Button>
    </>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    try {
      await login(formData);
    } catch (caught) {
      unstable_rethrow(caught);
      setError(caught instanceof Error ? caught.message : 'Login failed.');
    }
  }

  return (
    <form action={handleLogin}>
      {error ? (
        <Text c="red" size="sm" mb="md" data-testid="login-error">
          {error}
        </Text>
      ) : null}
      <LoginFields />
    </form>
  );
}
