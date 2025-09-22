import { NextRequest, NextResponse } from 'next/server';

const CACHE_CONTROL_HEADERS = {
  // Static assets - cache for 1 year
  STATIC: 'public, max-age=31536000, immutable',
  // API responses - cache for 5 minutes
  API: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
  // Dynamic content - cache for 1 minute
  DYNAMIC: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  // No cache for authenticated content
  NO_CACHE: 'no-cache, no-store, must-revalidate',
};

export function applyCacheHeaders(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;

  // Skip cache headers for development
  if (process.env.NODE_ENV !== 'production') {
    return response;
  }

  // Static assets
  if (pathname.match(/\.(ico|css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', CACHE_CONTROL_HEADERS.STATIC);
    response.headers.set('X-Cache-Type', 'static');
    return response;
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    // Don't cache auth-related endpoints
    if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/logout')) {
      response.headers.set('Cache-Control', CACHE_CONTROL_HEADERS.NO_CACHE);
      response.headers.set('X-Cache-Type', 'no-cache-auth');
      return response;
    }

    // Cache public API endpoints
    if (pathname.includes('/bounties') || pathname.includes('/stats')) {
      response.headers.set('Cache-Control', CACHE_CONTROL_HEADERS.API);
      response.headers.set('X-Cache-Type', 'api');
      response.headers.set('Vary', 'Authorization');
      return response;
    }

    // Default API cache
    response.headers.set('Cache-Control', CACHE_CONTROL_HEADERS.DYNAMIC);
    response.headers.set('X-Cache-Type', 'dynamic');
    return response;
  }

  // Public pages
  if (pathname === '/' || pathname.startsWith('/bounty/') || pathname === '/bounties') {
    response.headers.set('Cache-Control', CACHE_CONTROL_HEADERS.DYNAMIC);
    response.headers.set('X-Cache-Type', 'page');
    response.headers.set('Vary', 'Cookie');
    return response;
  }

  // Authenticated pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    response.headers.set('Cache-Control', CACHE_CONTROL_HEADERS.NO_CACHE);
    response.headers.set('X-Cache-Type', 'no-cache-auth');
    return response;
  }

  return response;
}

export function setSecurityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us.i.posthog.com https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://us.i.posthog.com; font-src 'self' data:;"
    );
  }

  return response;
}