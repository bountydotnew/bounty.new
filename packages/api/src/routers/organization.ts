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

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	protectedProcedure,
	orgProcedure,
	orgOwnerProcedure,
	router,
} from "../trpc";
import { member, organization } from "@bounty/db";
import { eq, and, sql, count, ne } from "drizzle-orm";
import { isReservedSlug } from "@bounty/types/auth";

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
			user_image: string | null;
			user_handle: string | null;
		}>(sql`
      SELECT
        m.id,
        m.user_id,
        m.role,
        m.created_at,
        u.name as user_name,
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
					image: m.user_image,
					handle: m.user_handle,
				},
			})),
		};
	}),

	/**
	 * Update organization slug.
	 * Only owners can update the slug.
	 */
	updateSlug: orgOwnerProcedure
		.input(
			z.object({
				slug: z
					.string()
					.min(2, "Slug must be at least 2 characters")
					.max(32, "Slug must be at most 32 characters")
					.regex(
						/^[a-z0-9-]+$/,
						"Slug can only contain lowercase letters, numbers, and hyphens",
					)
					.refine(
						(val) => !val.startsWith("-"),
						"Slug cannot start with a hyphen",
					)
					.refine((val) => !val.endsWith("-"), "Slug cannot end with a hyphen")
					.refine(
						(val) => !/--/.test(val),
						"Slug cannot contain consecutive hyphens",
					),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { slug } = input;

			// Check if slug is reserved
			if (isReservedSlug(slug)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This slug is reserved and cannot be used.",
				});
			}

			// Check if slug is already taken by another org
			const existing = await ctx.db
				.select({ id: organization.id })
				.from(organization)
				.where(
					and(eq(organization.slug, slug), ne(organization.id, ctx.org.id)),
				)
				.then((rows) => rows[0]);

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This slug is already taken.",
				});
			}

			// Update the slug
			await ctx.db
				.update(organization)
				.set({ slug })
				.where(eq(organization.id, ctx.org.id));

			return { success: true, slug };
		}),

	/**
	 * Delete organization.
	 * Only owners can delete the organization.
	 * Personal teams cannot be deleted.
	 */
	deleteOrg: orgOwnerProcedure.mutation(async ({ ctx }) => {
		// Prevent deletion of personal teams
		if (ctx.org.isPersonal) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Personal teams cannot be deleted.",
			});
		}

		// Check member count - require confirmation for orgs with multiple members
		const memberCount = await ctx.db
			.select({ count: count() })
			.from(member)
			.where(eq(member.organizationId, ctx.org.id));

		if ((memberCount[0]?.count ?? 0) > 1) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					"Cannot delete organization with multiple members. Remove all members first.",
			});
		}

		// Delete the organization (cascade will handle members and invitations)
		await ctx.db.delete(organization).where(eq(organization.id, ctx.org.id));

		return { success: true };
	}),
});
