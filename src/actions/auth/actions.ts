'use server';

import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  ensureLoginNotRateLimited,
  RateLimitError,
  recordFailedLoginAttempt,
} from '@/lib/rate-limit/loginGuard';
import { routes } from '@/routes';
import { verifyPassword } from '@/utils/auth/password';
import { createSession, destroySession } from '@/utils/auth/session';

export type LoginFormState = { error: string } | null;

async function authenticateUser(email: string, password: string) {
  await ensureLoginNotRateLimited(email);

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailedLoginAttempt(email);
    throw new Error('Invalid email or password.');
  }

  return user;
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  if (!email || !password) throw new Error('Please provide both your email & password.');

  const user = await authenticateUser(email, password);
  await createSession({ id: user.id, email: user.email });
  revalidatePath(routes.home, 'layout');
  redirect(routes.home);
}

/** Form-friendly login for the client (returns errors instead of throwing for bad credentials). */
export async function loginFormAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  if (!email || !password) {
    return { error: 'Please provide both your email & password.' };
  }

  try {
    const user = await authenticateUser(email, password);
    await createSession({ id: user.id, email: user.email });
    revalidatePath(routes.home, 'layout');
    redirect(routes.home);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Login failed.' };
  }
}

export async function logout() {
  await destroySession();
  redirect(routes.login);
}
