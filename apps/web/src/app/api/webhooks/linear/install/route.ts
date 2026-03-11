import { NextResponse } from 'next/server';
import { env } from '@bounty/env/server';

/**
 * Callback for the `actor=app` bot install OAuth flow.
 *
 * The bot uses a separate Linear OAuth app from the user integration.
 * When a workspace admin clicks "Install Bot" on the integrations page,
 * they're redirected to Linear's OAuth flow with actor=app. Linear
 * redirects back here with a `code` and `state` (the return path).
 *
 * Exchanging the code completes the install — the bot appears in
 * Linear's @mention dropdown. The token doesn't need to be stored.
 */

// Linear sends POST probes to webhook URLs. Acknowledge them.
export function POST() {
  return new Response('ok', { status: 200 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  // state carries the path to redirect back to (e.g. /org/integrations/linear/workspaceId)
  const state = url.searchParams.get('state');

  if (error) {
    console.error('[Linear Bot Install] OAuth error:', error);
    return NextResponse.json(
      { error: `Linear returned an error: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  // Use the bot app's credentials (separate from the user integration app)
  const clientId = env.LINEAR_BOT_CLIENT_ID;
  const clientSecret = env.LINEAR_BOT_CLIENT_SECRET;

  if (!(clientId && clientSecret)) {
    return NextResponse.json(
      { error: 'Linear bot credentials not configured' },
      { status: 500 }
    );
  }

  const redirectUri = `${env.BETTER_AUTH_URL}/api/webhooks/linear/install`;

  try {
    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Linear Bot Install] Token exchange failed:', text);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 502 }
      );
    }

    console.log('[Linear Bot Install] Bot installed successfully');

    // Redirect back to the page the user came from, with a success param
    const returnPath = state || '/settings/integrations';
    const separator = returnPath.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      new URL(
        `${returnPath}${separator}linear_bot=installed`,
        env.BETTER_AUTH_URL
      )
    );
  } catch (err) {
    console.error('[Linear Bot Install] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal error during token exchange' },
      { status: 500 }
    );
  }
}
