import { jwtVerify, SignJWT } from 'jose';
import type { AuthUser } from './types';

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: AuthUser, secret: Uint8Array): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
  secret: Uint8Array,
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    const email = payload.email;
    if (!id || typeof email !== 'string') return null;
    return { id, email };
  } catch {
    return null;
  }
}
