import { db, waitlist } from '@bounty/db';
import { track } from '@bounty/track';
import { validateFingerprint } from '@bounty/ui/lib/fingerprint-validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
  fingerprintData: z.object({
    thumbmark: z.string(),
    components: z.record(z.string(), z.any()),
    info: z.record(z.string(), z.any()).optional(),
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
          error: validation.error.issues[0]?.message || 'Invalid request data',
          success: false,
        },
        { status: 400 }
      );
    }

    const { email, fingerprintData } = validation.data;

    const fingerprintValidation = validateFingerprint(fingerprintData);
    if (!fingerprintValidation.isValid) {
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
      await db.insert(waitlist).values({
        email,
        hasAccess: false,
        createdAt: new Date(),
      });

      await track('waitlist_joined', { source: 'api' });
      return NextResponse.json({
        success: true,
        message: 'Successfully added to waitlist!',
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Database temporarily unavailable',
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
