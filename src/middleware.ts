import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
  authId?: string;
  role?: string;
  name?: string;
  email?: string;
  exp?: number;
}

function parseJwt(token: string): JwtPayload | null {
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
  const token =
    request.cookies.get('projexpro_token')?.value ||
    request.cookies.get('cat-admin-token')?.value;

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/auth');
  const isPaymentsRoute = pathname.startsWith('/payments');
  const isPublicRoute = isAuthRoute || isPaymentsRoute || pathname === '/unauthorized';

  const hasToken = Boolean(token);
  const payload = token ? parseJwt(token) : null;

  // If unauthenticated user tries to access protected routes, redirect to login
  if (!hasToken && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user tries to access auth routes, redirect based on role
  if (hasToken && isAuthRoute) {
    const isServiceProvider = payload?.role === 'service_provider';
    const targetUrl = isServiceProvider ? '/services_provider/overview' : '/';
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // Role-based route guard for authenticated users
  if (hasToken && payload?.role) {

    const isServiceProvider = payload.role === 'service_provider';

    // Service provider landing on root or property manager specific routes
    if (isServiceProvider) {
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/services_provider/overview', request.url));
      }
      if (
        pathname.startsWith('/properties') ||
        pathname.startsWith('/service-requests') ||
        pathname.startsWith('/invoices')
      ) {
        return NextResponse.redirect(new URL('/services_provider/overview', request.url));
      }
    }

    // Property manager attempting to access service provider routes
    if (!isServiceProvider && pathname.startsWith('/services_provider')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon, images, and public assets
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|ttf|woff|woff2)$).*)',
  ],
};

