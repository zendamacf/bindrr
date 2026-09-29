import { describe, expect, it } from 'vitest';
import { getClientIpFromHeaders, getClientIpFromRequest } from './clientIp';

describe('client IP helpers', () => {
  it('reads the first address from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' });
    expect(getClientIpFromHeaders(headers)).toBe('203.0.113.1');
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.2' });
    expect(getClientIpFromHeaders(headers)).toBe('198.51.100.2');
  });

  it('returns unknown when no IP headers are present', () => {
    expect(getClientIpFromHeaders(new Headers())).toBe('unknown');
  });

  it('reads IP from a Request', () => {
    const request = new Request('http://localhost/api', {
      headers: { 'cf-connecting-ip': '192.0.2.44' },
    });
    expect(getClientIpFromRequest(request)).toBe('192.0.2.44');
  });
});
