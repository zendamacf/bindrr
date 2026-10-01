import { describe, expect, it } from 'vitest';
import { initialsFromEmail } from './emailInitials';

describe('initialsFromEmail', () => {
  it('uses two initials from dotted local parts', () => {
    expect(initialsFromEmail('jane.doe@example.com')).toBe('JD');
  });

  it('uses two initials from separated local parts', () => {
    expect(initialsFromEmail('jane_doe@example.com')).toBe('JD');
  });

  it('uses the first two characters for a single local part', () => {
    expect(initialsFromEmail('player@example.com')).toBe('PL');
  });

  it('returns a placeholder when the local part is empty', () => {
    expect(initialsFromEmail('@example.com')).toBe('?');
  });
});
