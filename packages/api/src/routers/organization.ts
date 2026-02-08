/**
 * Organization (Team) tRPC Router
 *
 * Supplementary queries for org data. Core CRUD and switching is handled
 * by Better Auth's organization plugin directly (authClient.organization.*).
 *
 * This router provides:
 * - List user's orgs with member counts
 * - Get active org details
 * - Get org members
 */

import {
  protectedProcedure,
  orgProcedure,
  router,
} from '../trpc';
import { member, organization } from '@bounty/db';
import { eq, and, sql, count } from 'drizzle-orm';

export const organizationRouter = router({
  /**
   * List all organizations the current user is a member of.
   * Returns org details + the user's role in each + member count.
   */
  listMyOrgs: protectedProcedure.query(async ({ ctx }) => {
    const orgs = await ctx.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        isPersonal: organization.isPersonal,
        createdAt: organization.createdAt,
        role: member.role,
        memberCount: sql<number>`(
          SELECT count(*)::int FROM ${member} m2
          WHERE m2.organization_id = ${organization.id}
        )`,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, ctx.session.user.id))
      .orderBy(organization.createdAt);

    return {
      success: true,
      orgs,
    };
  }),

  /**
   * Get the active organization's details.
   * Uses the orgProcedure middleware which validates activeOrganizationId.
   */
  getActiveOrg: orgProcedure.query(async ({ ctx }) => {
    // ctx.org is already populated by orgProcedure middleware
    const memberCount = await ctx.db
      .select({ count: count() })
      .from(member)
      .where(eq(member.organizationId, ctx.org.id));

    return {
      success: true,
      org: {
        id: ctx.org.id,
        name: ctx.org.name,
        slug: ctx.org.slug,
        logo: ctx.org.logo,
        isPersonal: ctx.org.isPersonal,
        createdAt: ctx.org.createdAt,
      },
      role: ctx.orgMembership.role,
      memberCount: memberCount[0]?.count ?? 0,
    };
  }),

  /**
   * Get members of the active organization.
   */
  getMembers: orgProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.execute<{
      id: string;
      user_id: string;
      role: string;
      created_at: Date;
      user_name: string | null;
      user_email: string;
      user_image: string | null;
      user_handle: string | null;
    }>(sql`
      SELECT
        m.id,
        m.user_id,
        m.role,
        m.created_at,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image,
        u.handle as user_handle
      FROM ${member} m
      INNER JOIN "user" u ON u.id = m.user_id
      WHERE m.organization_id = ${ctx.org.id}
      ORDER BY m.created_at ASC
    `);

    return {
      success: true,
      members: members.rows.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        createdAt: m.created_at,
        user: {
          name: m.user_name,
          email: m.user_email,
          image: m.user_image,
          handle: m.user_handle,
        },
      })),
    };
  }),
});
