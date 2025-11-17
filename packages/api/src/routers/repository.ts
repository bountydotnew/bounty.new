import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { GithubManager } from '../../driver/github';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { account } from '@bounty/db';
import { eq, and } from 'drizzle-orm';

const githubToken = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN || undefined;
const github = new GithubManager(githubToken ? { token: githubToken } : {});

export const repositoryRouter = router({
  stats: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input }) => {
      const basic = await github.getRepoBasics(input.repo);
      const contributors = await github.getContributors(input.repo);
      const openPRs = await github.getOpenPRs(input.repo);
      return {
        repo: basic,
        contributorsCount: contributors.length,
        openPRs,
      };
    }),
  contributors: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input }) => {
      return github.getContributors(input.repo);
    }),
  recentCommits: publicProcedure
    .input(
      z.object({
        repo: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return github.getRecentCommits(input.repo, input.limit);
    }),
  biggestCommitByUser: publicProcedure
    .input(z.object({ repo: z.string(), username: z.string() }))
    .query(async ({ input }) => {
      return github.getBiggestCommitByUser(input.repo, input.username);
    }),
  issueFromUrl: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      try {
        const data = await github.getIssueFromUrl(input.url);
        return { success: true, data };
      } catch (err) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Failed to resolve issue from URL',
          cause: err,
        });
      }
    }),
  userRepos: publicProcedure
    .input(
      z.object({ username: z.string().trim().min(1, 'username is required') })
    )
    .query(async ({ input }) => {
      try {
        const repos = await github.getUserRepos(input.username);
        return repos;
      } catch (_err) {
        return [];
      }
    }),
  myRepos: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get GitHub account for the authenticated user
      const githubAccount = await ctx.db.query.account.findFirst({
        where: and(
          eq(account.userId, ctx.session.user.id),
          eq(account.providerId, 'github')
        ),
      });

      if (!githubAccount?.accessToken) {
        console.log('[myRepos] No GitHub account or access token found for user:', ctx.session.user.id);
        return { success: false, error: 'GitHub account not connected' };
      }

      // Create GithubManager with user's token
      const userGithub = new GithubManager({ token: githubAccount.accessToken });

      // Get authenticated user's repos
      const repos = await userGithub.getAuthenticatedUserRepos();
      console.log('[myRepos] Fetched repos:', repos);
      return repos;
    } catch (error) {
      console.error('[myRepos] Error fetching repos:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching repositories';
      return { success: false, error: errorMessage };
    }
  }),
  searchIssues: publicProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        q: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const owner = input.owner?.trim();
        const repo = input.repo?.trim();
        const q = (input.q || '').trim();
        if (!(owner && repo && q)) {
          return [];
        }
        return await github.searchIssues(owner, repo, q);
      } catch {
        return [];
      }
    }),
  listIssues: publicProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const owner = input.owner?.trim();
        const repo = input.repo?.trim();
        if (!(owner && repo)) {
          return [];
        }
        const issues = await github.listIssues(owner, repo);
        // Sort by activity (comments + recency) - most active first
        return issues.sort((a, b) => {
          // Primary sort: by comments (activity)
          if (b.comments !== a.comments) {
            return b.comments - a.comments;
          }
          // Secondary sort: by updated_at (most recent)
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      } catch {
        return [];
      }
    }),
  branches: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input }) => {
      try {
        return await github.getBranches(input.repo);
      } catch {
        return [];
      }
    }),
  defaultBranch: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input }) => {
      try {
        return await github.getDefaultBranch(input.repo);
      } catch (error) {
        console.error('Failed to fetch default branch:', error);
        return 'main';
      }
    }),
});
