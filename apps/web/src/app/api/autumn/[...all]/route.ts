import { auth } from '@bounty/auth/server';
import { db, organization } from '@bounty/db';
import { eq } from 'drizzle-orm';
import { autumnHandler } from 'autumn-js/next';
import { env } from '@bounty/env/server';

export const { GET, POST } = autumnHandler({
  /**
   * Identify the authenticated customer from the request.
   *
   * Billing is org-scoped: the customerId is the active organization ID.
   * This means each org has its own Autumn customer, plan, and usage.
   * The user's email is passed for Stripe receipt purposes.
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

    const activeOrgId = session.session?.activeOrganizationId;
    if (!activeOrgId) {
      // No active org — can't identify a billing customer
      return null;
    }

    // Look up org name for Autumn customer data
    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, activeOrgId))
      .limit(1);

    // Return org-scoped customer ID and data for Autumn
    return {
      customerId: activeOrgId,
      customerData: {
        name: org?.name ?? session.user.name ?? undefined,
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
