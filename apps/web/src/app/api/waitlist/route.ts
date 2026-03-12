import { auth } from '@bounty/auth/server';
import { db, waitlist } from '@bounty/db';
import { track } from '@bounty/track';
import { validateFingerprint } from '@bounty/ui/lib/fingerprint-validation';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const WAITLIST_POSITION_LOCK_KEY = 53_407;
const waitlistRequestSchema = z.object({
  email: z.string().email(),
  fingerprintData: z.unknown(),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = waitlistRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid waitlist request',
          success: false,
        },
        { status: 400 }
      );
    }

    // Check for authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Must be logged in to join waitlist',
          success: false,
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const submittedEmail = parsedBody.data.email;

    if (!userEmail) {
      return NextResponse.json(
        {
          error: 'User email is required',
          success: false,
        },
        { status: 400 }
      );
    }

    if (submittedEmail !== userEmail) {
      return NextResponse.json(
        {
          error: 'Use the same email as your signed-in GitHub account',
          success: false,
        },
        { status: 400 }
      );
    }

    const fingerprintValidation = validateFingerprint(
      parsedBody.data.fingerprintData
    );
    if (!fingerprintValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid device fingerprint',
          success: false,
        },
        { status: 400 }
      );
    }

    const waitlistResult = await db.transaction(async (tx) => {
      // Serialize queue-position allocation so concurrent joins cannot reuse
      // the same rank.
      await tx.execute(
        sql`select pg_advisory_xact_lock(${WAITLIST_POSITION_LOCK_KEY})`
      );

      const existingEntry = await tx.query.waitlist.findFirst({
        where: (fields, { eq, or }) =>
          or(eq(fields.userId, userId), eq(fields.email, userEmail)),
      });

      if (existingEntry) {
        if (!existingEntry.userId) {
          await tx
            .update(waitlist)
            .set({ userId })
            .where(eq(waitlist.id, existingEntry.id));
        }

        let position = existingEntry.position ?? null;
        if (position === null) {
          const [positionResult] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(waitlist)
            .where(sql`${waitlist.createdAt} < ${existingEntry.createdAt}`);

          position = (positionResult?.count ?? 0) + 1;

          await tx
            .update(waitlist)
            .set({ position })
            .where(eq(waitlist.id, existingEntry.id));
        }

        return {
          alreadyJoined: true,
          position,
        };
      }

      const [countResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(waitlist);
      const position = (countResult?.count ?? 0) + 1;

      await tx.insert(waitlist).values({
        email: userEmail,
        userId,
        createdAt: new Date(),
        position,
      });

      return {
        alreadyJoined: false,
        position,
      };
    });

    if (!waitlistResult.alreadyJoined) {
      await track('waitlist_joined', { source: 'api', userId });
    }

    return NextResponse.json({
      success: true,
      message: waitlistResult.alreadyJoined
        ? "You're already on the waitlist!"
        : 'Successfully added to waitlist!',
      alreadyJoined: waitlistResult.alreadyJoined,
      position: waitlistResult.position,
    });
  } catch (_error) {
    return NextResponse.json(
      {
        error: 'Database temporarily unavailable',
        success: false,
      },
      { status: 500 }
    );
  }
}
