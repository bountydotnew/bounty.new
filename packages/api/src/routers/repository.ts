import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { GithubManager } from "../../driver/github";

const github = new GithubManager({ token: process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN });

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
    .input(z.object({ repo: z.string(), limit: z.number().min(1).max(100).default(20) }))
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
      return github.getIssueFromUrl(input.url); 
    }),
  userRepos: publicProcedure
    .input(z.object({ username: z.string().trim().min(1, "username is required") }))
    .query(async ({ input }) => {
      try {
        const data = await github.getUserRepos(input.username);
        return { success: true, data };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user repositories",
          cause: err,
        });
      }
    }),
  searchIssues: publicProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), q: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const owner = input.owner?.trim();
        const repo = input.repo?.trim();
        const q = (input.q || "").trim();
        if (!owner || !repo || !q) return [];
        return await github.searchIssues(owner, repo, q);
      } catch {
        return [];
      }
    }),
});
