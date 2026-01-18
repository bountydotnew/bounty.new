import { auth } from '@bounty/auth/server';
import { db } from '@bounty/db';
import type { NextRequest } from 'next/server';

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  let clientIP = forwarded || realIP || cfConnectingIP || 'unknown';

  if (clientIP?.includes(',')) {
    clientIP = clientIP.split(',')[0]?.trim() ?? clientIP;
  }

  return clientIP;
}

/**
 * Generate a unique request ID for tracing
 * Uses existing header if present (from load balancer/CDN), otherwise generates new
 */
function getRequestId(req: NextRequest): string {
  // Check for existing request ID from upstream (CloudFlare, Vercel, etc.)
  const existingId =
    req.headers.get('x-request-id') ||
    req.headers.get('x-vercel-id') ||
    req.headers.get('cf-ray');

  if (existingId) {
    return existingId;
  }

  // Generate a new request ID
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createContext(req: NextRequest) {
  // Better Auth's getSession supports both cookies AND Bearer tokens
  // Just pass the headers and it will check both!
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Debug logging for session issues
  const cookieHeader = req.headers.get('cookie');
  const hasCookies = !!cookieHeader;
  const hasSessionCookie = cookieHeader?.includes('better-auth.session') ?? false;
  const authHeader = req.headers.get('authorization');
  
  // Only log for protected endpoints that need auth
  const isBillingEndpoint = req.url.includes('billing');
  if (!session && isBillingEndpoint) {
    console.log('[Context] No session found for billing:', {
      hasCookies,
      hasSessionCookie,
      hasAuthHeader: !!authHeader,
      cookies: cookieHeader ? cookieHeader.substring(0, 100) + '...' : 'none',
      url: req.url,
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
    });
  }

  const clientIP = getClientIP(req);
  const requestId = getRequestId(req);

  return {
    session,
    clientIP,
    requestId,
    req,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
