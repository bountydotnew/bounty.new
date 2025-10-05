import { auth } from '@bounty/auth/server';
import { db } from '@bounty/db';
import type { NextRequest } from 'next/server';

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  let clientIP = forwarded || realIP || cfConnectingIP || 'unknown';

  if (clientIP?.includes(',')) {
    clientIP = clientIP.split(',')[0].trim();
  }

  return clientIP;
}

export async function createContext(req: NextRequest) {
  // Check for bearer token first (for device authorization / VS Code extension)
  const authHeader = req.headers.get('authorization');
  let session = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // Validate the access token from device authorization
      session = await auth.api.getSession({
        headers: new Headers({
          authorization: `Bearer ${token}`,
        }),
      });
    } catch (error) {
      // Token validation failed, continue without session
      console.error('Bearer token validation failed:', error);
    }
  }

  // Fall back to cookie-based session if no bearer token
  if (!session) {
    session = await auth.api.getSession({
      headers: req.headers,
    });
  }

  const clientIP = getClientIP(req);

  return {
    session,
    clientIP,
    req,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
