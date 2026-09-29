const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'] as const;

function firstIp(value: string): string {
  const trimmed = value.split(',')[0]?.trim();
  return trimmed || 'unknown';
}

export function getClientIpFromHeaders(headers: Headers): string {
  for (const name of IP_HEADERS) {
    const value = headers.get(name);
    if (value) return firstIp(value);
  }
  return 'unknown';
}

export function getClientIpFromRequest(request: Request): string {
  return getClientIpFromHeaders(request.headers);
}
