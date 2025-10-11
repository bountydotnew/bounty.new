import { type NextRequest, NextResponse } from 'next/server';
import { db, bounty } from '@bounty/db';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const [result] = await db
      .select({
        id: bounty.id,
      })
      .from(bounty)
      .where(eq(bounty.status, 'open'))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (result?.id) {
      return NextResponse.redirect(new URL(`/bounty/${result.id}`, request.url));
    }

    return NextResponse.redirect(new URL('/bounties', request.url));
  } catch (error) {
    console.error('[Random Bounty API] Error:', error);
    return NextResponse.redirect(new URL('/bounties', request.url));
  }
}
