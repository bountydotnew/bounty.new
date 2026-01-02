import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@bounty/auth/server';
import { db } from '@bounty/db';
import { account } from '@bounty/db/src/schema/auth';
import { eq, and } from 'drizzle-orm';
import { env as serverEnv } from '@bounty/env/server';

// Force dynamic rendering to prevent build-time validation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Discord OAuth callback endpoint
 * This handles linking Discord accounts to bounty.new accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Lazy import to avoid build-time evaluation
    const { discordBotEnv: env } = await import('@bounty/env/discord-bot');
    
    // Validate Discord env variables at runtime
    const discordClientId = env.DISCORD_CLIENT_ID;
    const discordClientSecret = env.DISCORD_CLIENT_SECRET;
    
    if (!discordClientId) {
      return NextResponse.json(
        { error: 'Discord OAuth is not configured: DISCORD_CLIENT_ID is missing' },
        { status: 500 }
      );
    }
    
    if (!discordClientSecret) {
      return NextResponse.json(
        { error: 'Discord OAuth is not configured: DISCORD_CLIENT_SECRET is missing' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent('Missing code parameter')}`
      );
    }
    
    if (!state) {
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent('Missing state parameter')}`
      );
    }

    // Get the current session to link Discord to the logged-in user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent('You must be logged in to link your Discord account')}`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: discordClientId,
        client_secret: discordClientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${env.BETTER_AUTH_URL}/api/discord/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Discord token exchange failed:', errorData);
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent('Failed to exchange authorization code')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent('Failed to fetch Discord user info')}`
      );
    }

    const discordUser = await userResponse.json();
    const discordId = discordUser.id;

    // Check if this Discord account is already linked to another user
    const [existingAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.providerId, 'discord'),
          eq(account.accountId, discordId)
        )
      )
      .limit(1);

    if (existingAccount && existingAccount.userId !== session.user.id) {
      return NextResponse.redirect(
        `${env.BETTER_AUTH_URL}/discord/link?error=${encodeURIComponent('This Discord account is already linked to another bounty.new account')}`
      );
    }

    // Link or update the Discord account
    if (existingAccount) {
      // Update existing account
      await db
        .update(account)
        .set({
          accessToken,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existingAccount.id));
    } else {
      // Create new account link
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: discordId,
        providerId: 'discord',
        userId: session.user.id,
        accessToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${env.BETTER_AUTH_URL}/discord/link?success=true`
    );
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    // Fallback to server env if Discord env import failed
    const fallbackUrl = serverEnv.BETTER_AUTH_URL;
    return NextResponse.redirect(
      `${fallbackUrl}/discord/link?error=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
}
