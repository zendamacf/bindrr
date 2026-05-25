import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { verifyPassword } from './password';

describe('verifyPassword', () => {
  it('returns true for a matching password', async () => {
    const hash = await bcrypt.hash('correct-horse', 4);
    await expect(verifyPassword('correct-horse', hash)).resolves.toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await bcrypt.hash('correct-horse', 4);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
