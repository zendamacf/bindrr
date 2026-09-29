'use client';

import { Button, PasswordInput, Text, TextInput } from '@mantine/core';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { type LoginFormState, loginFormAction } from '@/actions/auth/actions';

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
  const [state, formAction] = useActionState<LoginFormState, FormData>(loginFormAction, null);

  return (
    <form action={formAction}>
      {state?.error ? (
        <Text c="red" size="sm" mb="md" data-testid="login-error">
          {state.error}
        </Text>
      ) : null}
      <LoginFields />
    </form>
  );
}
