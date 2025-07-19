import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Ratelimit } from '@unkey/ratelimit';
import { validateFingerprint } from '@/lib/fingerprint-validation';
import { grim } from '@/hooks/use-dev-log';

const { log, error, warn } = grim();


// Only initialize Unkey if the root key is available
const unkey = process.env.UNKEY_ROOT_KEY ? new Ratelimit({
  rootKey: process.env.UNKEY_ROOT_KEY,
  namespace: "waitlist",
  limit: 3,
  duration: "1h",
  async: false,
}) : null;

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
  fingerprintData: z.object({
    thumbmark: z.string(),
    components: z.record(z.any()),
    info: z.record(z.any()).optional(),
    version: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || 'Invalid request data',
          success: false
        },
        { status: 400 }
      );
    }

    const { email, fingerprintData } = validation.data;

    // Validate fingerprint
    const fingerprintValidation = validateFingerprint(fingerprintData);
    if (!fingerprintValidation.isValid) {
      log('[Waitlist] Fingerprint validation failed:', fingerprintValidation.errors);
      return NextResponse.json(
        {
          error: 'Invalid device fingerprint: ' + fingerprintValidation.errors.join(', '),
          success: false
        },
        { status: 400 }
      );
    }

    // Use the thumbmark hash as the rate limit identifier
    const identifier = fingerprintData.thumbmark;

    log('[Waitlist] Processing request for email:', email);
    log('[Waitlist] Using fingerprint identifier:', identifier.substring(0, 8) + '...');

    // Check rate limit with Unkey (if available)
    let rateLimitResult: any = { remaining: null, limit: null };
    if (unkey) {
      try {
        const result = await unkey.limit(identifier);
        rateLimitResult = result;
        log('[Waitlist] Rate limit result:', {
          success: result.success,
          remaining: result.remaining,
          limit: result.limit,
          reset: result.reset
        });

        if (!result.success) {
          const resetTime = new Date(result.reset);
          return NextResponse.json(
            {
              error: 'Rate limit exceeded. Please try again later.',
              success: false,
              rateLimited: true,
              resetTime: resetTime.toISOString(),
              remaining: result.remaining,
              limit: result.limit,
            },
            { status: 429 }
          );
        }
      } catch (err) {
        error('[Waitlist] Unkey error:', err);
        // Continue without rate limiting if Unkey fails
        warn('[Waitlist] Continuing without rate limiting due to Unkey unavailability');
      }
    } else {
      warn('[Waitlist] UNKEY_ROOT_KEY not configured, skipping rate limiting');
    }

    // Add email to waitlist database via HTTP request to tRPC endpoint
    let dbError = null;
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/trpc/earlyAccess.addToWaitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: { email }
        }),
      });

      if (response.ok) {
        log('[Waitlist] Successfully added email to waitlist:', email);
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        warn('[Waitlist] Failed to save to database:', response.status, errorData);
        dbError = `Database error: ${errorData.error?.message || 'Failed to save'}`;
      }
    } catch (dbConnectionError) {
      error('[Waitlist] Database connection error:', dbConnectionError);
      dbError = 'Database temporarily unavailable';
    }

    return NextResponse.json({
      success: true,
      message: dbError ? 'Request validated but may not be saved to database' : 'Successfully added to waitlist!',
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
      warning: dbError || undefined,
    });

  } catch (error) {
    warn('[Waitlist] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}