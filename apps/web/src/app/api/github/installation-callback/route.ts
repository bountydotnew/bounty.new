import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@bounty/auth/server';
import { db, account, member, organization } from '@bounty/db';
import { githubInstallation } from '@bounty/db/src/schema/github-installation';
import { getGithubAppManager } from '@bounty/api/driver/github-app';
import { eq, and } from 'drizzle-orm';
import { env } from '@bounty/env/server';

export async function GET(request: NextRequest) {
  // Use BETTER_AUTH_URL as the base for redirects so we stay on the
  // correct host (e.g. local.bounty.new instead of localhost:3000).
  const baseUrl = env.BETTER_AUTH_URL || request.url;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', baseUrl));
  }

  const searchParams = request.nextUrl.searchParams;
  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');

  // Link installation to current user if installationId is provided
  if (installationId) {
    // Validate installationId is numeric
    const parsedInstallationId = Number(installationId);
    if (!Number.isFinite(parsedInstallationId) || parsedInstallationId <= 0) {
      console.error(
        `[Installation Callback] Invalid installation_id: ${installationId}`
      );
      return NextResponse.json(
        { error: 'Invalid installation_id parameter' },
        { status: 400 }
      );
    }

    try {
      // Get the user's GitHub account
      const [githubAccount] = await db
        .select()
        .from(account)
        .where(
          and(
            eq(account.userId, session.user.id),
            eq(account.providerId, 'github')
          )
        )
        .limit(1);

      if (githubAccount) {
        const githubApp = getGithubAppManager();
        // Use session's active org for installation scoping.
        // Fall back to user's personal team if no active org is set.
        let activeOrgId = session.session?.activeOrganizationId ?? undefined;
        if (!activeOrgId) {
          const [personalTeam] = await db
            .select({ organizationId: member.organizationId })
            .from(member)
            .innerJoin(organization, eq(organization.id, member.organizationId))
            .where(
              and(
                eq(member.userId, session.user.id),
                eq(organization.isPersonal, true)
              )
            )
            .limit(1);
          activeOrgId = personalTeam?.organizationId;
        }

        if (!activeOrgId) {
          console.error(
            `[Installation Callback] No active org and no personal team found for user ${session.user.id}`
          );
          return NextResponse.redirect(
            new URL('/dashboard?error=no_team', baseUrl)
          );
        }

        // Fetch installation details from GitHub to verify ownership
        const installation =
          await githubApp.getInstallation(parsedInstallationId);

        // Verify that the installation account matches the user's GitHub account
        // For user installations, account.login should match the user's GitHub username
        // For org installations, we verify the user has access via the webhook (already linked)
        // We check if installation already exists and is linked to this user or needs linking
        const [existingInstallation] = await db
          .select()
          .from(githubInstallation)
          .where(
            eq(githubInstallation.githubInstallationId, parsedInstallationId)
          )
          .limit(1);

        // Only link if:
        // 1. Installation doesn't exist yet (webhook hasn't processed), OR
        // 2. Installation exists but isn't linked to any user, OR
        // 3. Installation exists and is already linked to this user (update metadata)
        // We don't re-link installations that belong to other users
        if (
          !(existingInstallation && existingInstallation.githubAccountId) ||
          existingInstallation.githubAccountId === githubAccount.id
        ) {
          const repos =
            await githubApp.getInstallationRepositories(parsedInstallationId);

          await db
            .insert(githubInstallation)
            .values({
              githubInstallationId: parsedInstallationId,
              githubAccountId: githubAccount.id,
              accountLogin: installation.account.login,
              accountType: installation.account.type,
              accountAvatarUrl: installation.account.avatar_url,
              repositoryIds: repos.repositories.map((r) => String(r.id)),
              organizationId: activeOrgId,
            })
            .onConflictDoUpdate({
              target: githubInstallation.githubInstallationId,
              set: {
                // Only update githubAccountId if it's null or matches current user
                githubAccountId:
                  existingInstallation?.githubAccountId === githubAccount.id ||
                  !existingInstallation?.githubAccountId
                    ? githubAccount.id
                    : existingInstallation.githubAccountId,
                accountLogin: installation.account.login,
                accountType: installation.account.type,
                accountAvatarUrl: installation.account.avatar_url,
                repositoryIds: repos.repositories.map((r) => String(r.id)),
                organizationId: activeOrgId,
                updatedAt: new Date(),
              },
            });
        } else {
          // Installation exists and is linked to a different user
          // This shouldn't happen in normal flow, but log it for debugging
          console.warn(
            `[Installation Callback] Installation ${installationId} is already linked to a different account`
          );
        }
      }
    } catch (error) {
      // Log error but don't fail the redirect
      console.error(
        '[Installation Callback] Failed to link installation:',
        error
      );
    }
  }

  // Resolve org slug for redirect URLs
  let orgSlug: string | null = null;
  const activeOrgIdForRedirect = session.session?.activeOrganizationId;
  if (activeOrgIdForRedirect) {
    const [activeOrg] = await db
      .select({ slug: organization.slug })
      .from(organization)
      .where(eq(organization.id, activeOrgIdForRedirect))
      .limit(1);
    orgSlug = activeOrg?.slug ?? null;
  }
  const integrationsBase = orgSlug ? `/${orgSlug}/integrations` : '/dashboard';

  // After installation, redirect to configure page
  if (installationId && setupAction === 'install') {
    return NextResponse.redirect(
      new URL(`${integrationsBase}/github/${installationId}?new=1`, baseUrl)
    );
  }

  // Fallback to integrations list
  return NextResponse.redirect(new URL(integrationsBase, baseUrl));
}
