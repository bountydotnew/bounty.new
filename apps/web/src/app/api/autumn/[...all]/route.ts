import { auth } from '@bounty/auth/server';
import { autumnHandler } from 'autumn-js/next';
import { env } from '@bounty/env/server';

export const { GET, POST } = autumnHandler({
  /**
   * Identify the authenticated customer from the request
   * Returns customer ID (user.id) and customer data (name, email)
   */
  async identify(request) {
    // Get the session from better-auth using the request headers
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If no session, return null (unauthenticated)
    if (!session?.user) {
      return null;
    }

    // Return customer ID and data for Autumn
    return {
      customerId: session.user.id,
      customerData: {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      },
    };
  },

  // Optional: override the Autumn API URL (defaults to https://api.useautumn.com/v1)
  url: env.AUTUMN_API_URL,

  // Optional: provide secret key directly (defaults to AUTUMN_SECRET_KEY env var)
  secretKey: env.AUTUMN_SECRET_KEY,

  // Optional: suppress logs
  suppressLogs: env.NODE_ENV === 'production',
});
