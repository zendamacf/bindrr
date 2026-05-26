import { cookies } from 'next/headers';
import { routes } from '@/routes';
import {
  encodeSecret,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
} from './session-token';
import type { AuthUser } from './types';

const SESSION_COOKIE = 'session';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return encodeSecret(secret);
}

export async function createSession(user: AuthUser) {
  const token = await signSessionToken(user, getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: routes.home,
  });
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return verifySessionToken(token, getSecret());
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
