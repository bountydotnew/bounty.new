import { db, waitlist } from '@bounty/db';
import { track } from '@bounty/track';
import { grim } from '@bounty/ui/hooks/use-dev-log';
import { validateFingerprint } from '@bounty/ui/lib/fingerprint-validation';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const { log, error, warn } = grim();

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
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || 'Invalid request data',
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

      const newEntryResult = await db.insert(waitlist).values({
        email,
        hasAccess: false,
        createdAt: new Date(),
      }).returning();

      const newEntry = newEntryResult[0];
      if (!newEntry) {
        throw new Error('Failed to create waitlist entry');
      }

      // Get the user's position (count of entries created before them)
      const positionResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(waitlist)
        .where(sql`${waitlist.createdAt} <= ${newEntry.createdAt}`);
      
      const position = positionResult[0]?.count ?? 1;

      log('[Waitlist] Successfully added email to waitlist:', email, 'Position:', position);
      await track('waitlist_joined', { source: 'api', position });
      
      return NextResponse.json({
        success: true,
        message: 'Successfully added to waitlist!',
        position,
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
  } catch (error) {
    warn('[Waitlist] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required', success: false },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      );
    }

    log('[Waitlist] Checking position for email:', email);

    // Check if email exists in waitlist
    const userEntry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1);

    if (userEntry.length === 0) {
      return NextResponse.json(
        { error: 'Email not found in waitlist', success: false },
        { status: 404 }
      );
    }

    const user = userEntry[0];

    // Get the user's current position
    const positionResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(waitlist)
      .where(sql`${waitlist.createdAt} <= ${user.createdAt}`);
    
    const position = positionResult[0]?.count ?? 1;

    log('[Waitlist] Position for email', email, ':', position);

    return NextResponse.json({
      success: true,
      position,
      email: email,
    });
  } catch (error) {
    warn('[Waitlist] Error checking position:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
