import { describe, expect, it } from 'vitest';
import { encodeSecret, signSessionToken, verifySessionToken } from './session-token';

const secret = encodeSecret('test-auth-secret-at-least-32-chars-long');
const user = { id: 42, email: 'user@example.com' };

describe('signSessionToken', () => {
  it('produces a verifiable token', async () => {
    const token = await signSessionToken(user, secret);
    await expect(verifySessionToken(token, secret)).resolves.toEqual(user);
  });
});

describe('verifySessionToken', () => {
  it('returns null for an invalid token', async () => {
    await expect(verifySessionToken('not-a-jwt', secret)).resolves.toBeNull();
  });

  it('returns null when signed with a different secret', async () => {
    const token = await signSessionToken(user, secret);
    const otherSecret = encodeSecret('different-secret-also-32-chars-min');
    await expect(verifySessionToken(token, otherSecret)).resolves.toBeNull();
  });

  it('returns null when subject is not a valid user id', async () => {
    const { SignJWT } = await import('jose');
    const token = await new SignJWT({ email: 'a@b.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('not-a-number')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifySessionToken(token, secret)).resolves.toBeNull();
  });

  it('returns null when email claim is not a string', async () => {
    const { SignJWT } = await import('jose');
    const token = await new SignJWT({ email: 123 })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifySessionToken(token, secret)).resolves.toBeNull();
  });
});
