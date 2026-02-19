import { featureVote } from "@bounty/db";
import { TRPCError } from "@trpc/server";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Available integrations to vote on
export const VOTABLE_INTEGRATIONS = [
	{
		key: "vscode",
		label: "VS Code",
		description: "Extension to view/claim bounties while coding",
	},
	{
		key: "notion",
		label: "Notion",
		description: "Create bounties from Notion tasks, sync status",
	},
	{
		key: "crypto",
		label: "Crypto",
		description: "Web3 payouts with USDC, ETH, and more",
	},
	{
		key: "email",
		label: "Email",
		description: "Digest and notifications for bounty updates",
	},
] as const;

export type VotableIntegrationKey =
	(typeof VOTABLE_INTEGRATIONS)[number]["key"];

const integrationKeySchema = z.enum(["vscode", "notion", "crypto", "email"]);

export const featureVotesRouter = router({
	// Get vote counts for all integrations
	getIntegrationVotes: publicProcedure.query(async ({ ctx }) => {
		const votes = await ctx.db
			.select({
				featureKey: featureVote.featureKey,
				voteCount: count(),
			})
			.from(featureVote)
			.where(eq(featureVote.featureType, "integration"))
			.groupBy(featureVote.featureKey);

		// Build a map of vote counts
		const voteCounts: Record<string, number> = {};
		for (const vote of votes) {
			voteCounts[vote.featureKey] = vote.voteCount;
		}

		// Return all integrations with their vote counts
		return VOTABLE_INTEGRATIONS.map((integration) => ({
			...integration,
			voteCount: voteCounts[integration.key] ?? 0,
		}));
	}),

	// Get the current user's vote (if any)
	getUserVote: protectedProcedure.query(async ({ ctx }) => {
		const userVote = await ctx.db.query.featureVote.findFirst({
			where: and(
				eq(featureVote.userId, ctx.session.user.id),
				eq(featureVote.featureType, "integration"),
			),
		});

		return userVote?.featureKey ?? null;
	}),

	// Vote for an integration (one vote per user)
	vote: protectedProcedure
		.input(
			z.object({
				integrationKey: integrationKeySchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { integrationKey } = input;

			// Check if user already voted for any integration
			const existingVote = await ctx.db.query.featureVote.findFirst({
				where: and(
					eq(featureVote.userId, ctx.session.user.id),
					eq(featureVote.featureType, "integration"),
				),
			});

			if (existingVote) {
				// Update existing vote
				if (existingVote.featureKey === integrationKey) {
					// Already voted for this one, no change needed
					return { success: true, action: "unchanged" as const };
				}

				await ctx.db
					.update(featureVote)
					.set({
						featureKey: integrationKey,
						createdAt: sql`now()`,
					})
					.where(eq(featureVote.id, existingVote.id));

				return { success: true, action: "changed" as const };
			}

			// Create new vote
			await ctx.db.insert(featureVote).values({
				userId: ctx.session.user.id,
				featureType: "integration",
				featureKey: integrationKey,
			});

			return { success: true, action: "created" as const };
		}),

	// Remove vote
	removeVote: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.delete(featureVote)
			.where(
				and(
					eq(featureVote.userId, ctx.session.user.id),
					eq(featureVote.featureType, "integration"),
				),
			);

		return { success: true };
	}),
});
