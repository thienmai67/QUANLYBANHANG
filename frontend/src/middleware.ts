import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isManagerRoute = pathname.startsWith('/manager');
  const isShipperRoute = pathname.startsWith('/shipper');
  const isSaleRoute = pathname.startsWith('/sale');

  if (!isManagerRoute && !isShipperRoute && !isSaleRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const roleCookie = request.cookies.get('user_role')?.value;

  // If a cookie token is present, enforce strict edge route verification
  if (token) {
    const payload = decodeJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);

    // If token is expired, redirect to login
    if (!payload || (payload.exp && payload.exp < now)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('reason', 'token_expired');
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('access_token');
      response.cookies.delete('user_role');
      return response;
    }

    const role = (roleCookie || payload.role || '').toUpperCase();

    // Check required role
    if (isManagerRoute && role !== 'MANAGER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    if (isShipperRoute && role !== 'SHIPPER' && role !== 'MANAGER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    if (isSaleRoute && role !== 'SALE' && role !== 'MANAGER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // If no cookie is present yet (e.g. initial navigation before cookie hydration),
  // pass through to client-side RouteGuard to inspect localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: ['/manager/:path*', '/shipper/:path*', '/sale/:path*'],
};
