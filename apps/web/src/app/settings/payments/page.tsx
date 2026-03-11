import { redirect } from 'next/navigation';
import { getServerSession } from '@bounty/auth/server-utils';
import { db, organization } from '@bounty/db';
import { eq } from 'drizzle-orm';

/**
 * Legacy redirect: /settings/payments -> /{orgSlug}/settings/payments
 *
 * Resolves the user's active org slug and redirects.
 * Preserves query params (e.g. ?onboarding=success).
 * Used by GitHub bot comments that link to bounty.new/settings/payments.
 */
export default async function SettingsPaymentsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Resolve active org slug
  const activeOrgId = (
    session as unknown as { session?: { activeOrganizationId?: string } }
  ).session?.activeOrganizationId;
  let orgSlug = '';

  if (activeOrgId) {
    const [org] = await db
      .select({ slug: organization.slug })
      .from(organization)
      .where(eq(organization.id, activeOrgId))
      .limit(1);

    if (org?.slug) {
      orgSlug = org.slug;
    }
  }

  // If no active org, try to find user's first org
  if (!orgSlug) {
    const { member } = await import('@bounty/db');
    const [membership] = await db
      .select({ slug: organization.slug })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, session.user.id))
      .limit(1);

    if (membership?.slug) {
      orgSlug = membership.slug;
    }
  }

  if (!orgSlug) {
    redirect('/');
  }

  // Preserve query params
  const params = await searchParams;
  const queryString = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = value;
        } else if (Array.isArray(value)) {
          acc[key] = value[0] ?? '';
        }
        return acc;
      },
      {} as Record<string, string>
    )
  ).toString();

  const target = `/${orgSlug}/settings/payments${queryString ? `?${queryString}` : ''}`;
  redirect(target);
}
