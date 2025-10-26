import { db, waitlist } from '@bounty/db';
import { track } from '@bounty/track';
import { grim } from '@bounty/ui/hooks/use-dev-log';
import { validateFingerprint } from '@bounty/ui/lib/fingerprint-validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const { log, error, warn } = grim();

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
  fingerprintData: z.object({
    thumbmark: z.string(),
    components: z.record(z.any(), z.any()),
    info: z.record(z.any(), z.any()).optional(),
    version: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.message,
          success: false,
        },
        { status: 400 }
      );
    }

    const { email, fingerprintData } = validation.data;

    log('[Waitlist] Processing request for email:', email);

    const fingerprintValidation = validateFingerprint(fingerprintData);
    if (!fingerprintValidation.isValid) {
      log(
        '[Waitlist] Fingerprint validation failed:',
        fingerprintValidation.errors
      );
      return NextResponse.json(
        {
          error:
            'Invalid device fingerprint: ' +
            fingerprintValidation.errors.join(', '),
          success: false,
        },
        { status: 400 }
      );
    }

    try {
      log('[Waitlist] Adding email to waitlist:', email);

      await db.insert(waitlist).values({
        email,
        hasAccess: false,
        createdAt: new Date(),
      });

      log('[Waitlist] Successfully added email to waitlist:', email);
      await track('waitlist_joined', { source: 'api' });
      return NextResponse.json({
        success: true,
        message: 'Successfully added to waitlist!',
      });
    } catch (dbConnectionError) {
      error('[Waitlist] Database connection error:', dbConnectionError);
      return NextResponse.json(
        {
          error: 'Database temporarily unavailable',
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (apiError) {
    warn('[Waitlist] Unexpected error:', apiError);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
