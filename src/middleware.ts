import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  authMiddlewareMatcher,
  pathRequiresSession,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/routePolicy';
import { routes } from '@/routes';
import { encodeSecret, verifySessionToken } from '@/utils/auth/session-token';

function unauthorizedResponse(request: NextRequest, pathname: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL(routes.login, request.url);
  if (pathname !== routes.home) {
    loginUrl.searchParams.set('from', pathname);
  }
  return NextResponse.redirect(loginUrl);
}

function misconfiguredResponse(request: NextRequest, pathname: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }
  return NextResponse.redirect(new URL(routes.login, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathRequiresSession(pathname)) {
    return NextResponse.next();
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return misconfiguredResponse(request, pathname);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorizedResponse(request, pathname);
  }

  const user = await verifySessionToken(token, encodeSecret(authSecret));
  if (!user) {
    return unauthorizedResponse(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: authMiddlewareMatcher,
};
