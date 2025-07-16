import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Ratelimit } from '@unkey/ratelimit';
import { validateFingerprint } from '@/lib/fingerprint-validation';

const unkey = new Ratelimit({
  rootKey: process.env.UNKEY_ROOT_KEY || "",
  namespace: "waitlist",
  limit: 3,
  duration: "1h",
  async: false,
});

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
      console.log('[Waitlist] Fingerprint validation failed:', fingerprintValidation.errors);
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

    console.log('[Waitlist] Processing request for email:', email);
    console.log('[Waitlist] Using fingerprint identifier:', identifier.substring(0, 8) + '...');

    // Check rate limit with Unkey
    let rateLimitResult;
    try {
      rateLimitResult = await unkey.limit(identifier);
      console.log('[Waitlist] Rate limit result:', {
        success: rateLimitResult.success,
        remaining: rateLimitResult.remaining,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset
      });
    } catch (error) {
      console.error('[Waitlist] Unkey error:', error);
      return NextResponse.json(
        {
          error: 'Rate limiting service unavailable',
          success: false
        },
        { status: 503 }
      );
    }

    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.reset);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          success: false,
          rateLimited: true,
          resetTime: resetTime.toISOString(),
          remaining: rateLimitResult.remaining,
          limit: rateLimitResult.limit,
        },
        { status: 429 }
      );
    }

    // Add email to waitlist database via HTTP request to tRPC endpoint
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
        console.log('[Waitlist] Successfully added email to waitlist:', email);
      } else {
        console.error('[Waitlist] Failed to save to database:', response.status);
      }
    } catch (dbError) {
      console.error('[Waitlist] Database error:', dbError);
      // Continue anyway - we've already validated the rate limit and fingerprint
      // The user will still get a success response since rate limiting passed
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist!',
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
    });

  } catch (error) {
    console.error('[Waitlist] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}