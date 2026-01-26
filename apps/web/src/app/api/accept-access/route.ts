import { auth } from '@bounty/auth/server';
import { db, user, waitlist } from '@bounty/db';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing_token', request.url));
    }

    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      // Redirect to login with callback
      const callback = `/accept-access?token=${token}`;
      return NextResponse.redirect(
        new URL(`/login?callback=${encodeURIComponent(callback)}`, request.url)
      );
    }

    // Find waitlist entry with this token
    const entry = await db.query.waitlist.findFirst({
      where: (fields, { eq }) => eq(fields.accessToken, token),
    });

    if (!entry) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }

    // Verify the email matches
    if (entry.email !== session.user.email) {
      return NextResponse.redirect(
        new URL('/?error=email_mismatch', request.url)
      );
    }

    // Grant early_access role
    await db
      .update(user)
      .set({ role: 'early_access' })
      .where(eq(user.id, session.user.id));

    // Clear the token (one-time use)
    await db
      .update(waitlist)
      .set({ accessToken: null })
      .where(eq(waitlist.id, entry.id));

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('[accept-access] Error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
