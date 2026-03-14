/**
 * Repository functions (GitHub API proxies).
 *
 * Replaces: packages/api/src/routers/repository.ts (11 procedures)
 *
 * All of these are Convex actions since they call the GitHub API.
 * They have NO database interactions — pure API proxies.
 */
import { action, query } from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';

/**
 * Helper: create an Octokit instance with the platform's GitHub token.
 */
async function createOctokit() {
  const { Octokit } = await import('@octokit/core');
  const { restEndpointMethods } = await import(
    '@octokit/plugin-rest-endpoint-methods'
  );
  const OctokitWithRest = Octokit.plugin(restEndpointMethods);
  return new OctokitWithRest({ auth: process.env.GITHUB_TOKEN });
}

/**
 * Parse a "owner/repo" string into { owner, repo }.
 */
function parseRepoIdentifier(repo: string): { owner: string; repo: string } {
  const parts = repo.split('/');
  if (parts.length !== 2) throw new ConvexError('INVALID_REPO_FORMAT');
  return { owner: parts[0]!, repo: parts[1]! };
}

/**
 * Get repo basics (stars, forks, open issues, description).
 * Replaces: repository.stats (publicProcedure query → action)
 */
export const stats = action({
  args: { repo: v.string() },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();
    const { owner, repo } = parseRepoIdentifier(args.repo);

    const { data } = await octokit.rest.repos.get({ owner, repo });

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      language: data.language,
      defaultBranch: data.default_branch,
    };
  },
});

/**
 * Get repo contributors.
 * Replaces: repository.contributors (publicProcedure query → action)
 */
export const contributors = action({
  args: { repo: v.string() },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();
    const { owner, repo } = parseRepoIdentifier(args.repo);

    const { data } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 30,
    });

    return data.map((c: any) => ({
      login: c.login,
      avatarUrl: c.avatar_url,
      contributions: c.contributions,
    }));
  },
});

/**
 * Get recent commits.
 * Replaces: repository.recentCommits (publicProcedure query → action)
 */
export const recentCommits = action({
  args: {
    repo: v.string(),
    limit: v.optional(v.float64()),
  },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();
    const { owner, repo } = parseRepoIdentifier(args.repo);

    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: args.limit ?? 10,
    });

    return data.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name,
      date: c.commit.author?.date,
      url: c.html_url,
    }));
  },
});

/**
 * Get biggest commit by a specific user.
 * Replaces: repository.biggestCommitByUser (publicProcedure query → action)
 */
export const biggestCommitByUser = action({
  args: {
    repo: v.string(),
    username: v.string(),
  },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();
    const { owner, repo } = parseRepoIdentifier(args.repo);

    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      author: args.username,
      per_page: 100,
    });

    if (data.length === 0) return null;

    // Get full commit data to find the biggest one
    let biggest = { sha: '', additions: 0, deletions: 0, total: 0 };

    for (const commit of data.slice(0, 20)) {
      try {
        const { data: full } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });
        const total = full.stats?.total ?? 0;
        if (total > biggest.total) {
          biggest = {
            sha: commit.sha,
            additions: full.stats?.additions ?? 0,
            deletions: full.stats?.deletions ?? 0,
            total,
          };
        }
      } catch {}
    }

    return biggest.total > 0 ? biggest : null;
  },
});

/**
 * Get issue details from a URL.
 * Replaces: repository.issueFromUrl (publicProcedure query → action)
 */
export const issueFromUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();

    // Parse GitHub URL: https://github.com/owner/repo/issues/123
    const match = args.url.match(
      /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/
    );
    if (!match) throw new ConvexError('INVALID_GITHUB_ISSUE_URL');

    const [, owner, repo, issueNumber] = match;

    const { data } = await octokit.rest.issues.get({
      owner: owner!,
      repo: repo!,
      issue_number: Number.parseInt(issueNumber!, 10),
    });

    return {
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state,
      labels: data.labels.map((l: any) => (typeof l === 'string' ? l : l.name)),
      url: data.html_url,
      createdAt: data.created_at,
      user: data.user
        ? { login: data.user.login, avatarUrl: data.user.avatar_url }
        : null,
    };
  },
});

/**
 * Get repos for a GitHub user.
 * Replaces: repository.userRepos (publicProcedure query → action)
 */
export const userRepos = action({
  args: { username: v.string() },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();

    const { data } = await octokit.rest.repos.listForUser({
      username: args.username,
      sort: 'updated',
      per_page: 30,
      type: 'owner',
    });

    return data.map((r: any) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url,
      updatedAt: r.updated_at,
    }));
  },
});

/**
 * Get authenticated user's repos.
 * Replaces: repository.myRepos (protectedProcedure query → action)
 */
export const myRepos = action({
  args: {},
  handler: async (ctx) => {
    // This would need the user's personal GitHub access token
    // from the Better Auth account table, not the platform token.
    // For now, return empty — needs auth integration.
    return [];
  },
});

/**
 * Search issues in a repo.
 * Replaces: repository.searchIssues (publicProcedure query → action)
 */
export const searchIssues = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    q: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();

    const query = args.q
      ? `${args.q} repo:${args.owner}/${args.repo} is:issue`
      : `repo:${args.owner}/${args.repo} is:issue is:open`;

    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: query,
      per_page: 20,
    });

    return data.items.map((i: any) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      url: i.html_url,
      createdAt: i.created_at,
    }));
  },
});

/**
 * List open issues in a repo.
 * Replaces: repository.listIssues (publicProcedure query → action)
 */
export const listIssues = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();

    const { data } = await octokit.rest.issues.listForRepo({
      owner: args.owner,
      repo: args.repo,
      state: 'open',
      per_page: 30,
    });

    return data
      .filter((i: any) => !i.pull_request)
      .map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        url: i.html_url,
        labels: i.labels.map((l: any) => (typeof l === 'string' ? l : l.name)),
        createdAt: i.created_at,
      }));
  },
});

/**
 * Get branches for a repo.
 * Replaces: repository.branches (publicProcedure query → action)
 */
export const branches = action({
  args: { repo: v.string() },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();
    const { owner, repo } = parseRepoIdentifier(args.repo);

    const { data } = await octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });

    return data.map((b: any) => ({
      name: b.name,
      protected: b.protected,
    }));
  },
});

/**
 * Get default branch for a repo.
 * Replaces: repository.defaultBranch (publicProcedure query → action)
 */
export const defaultBranch = action({
  args: { repo: v.string() },
  handler: async (_ctx, args) => {
    const octokit = await createOctokit();
    const { owner, repo } = parseRepoIdentifier(args.repo);

    const { data } = await octokit.rest.repos.get({ owner, repo });
    return { defaultBranch: data.default_branch };
  },
});

/**
 * List open pull requests for a repo.
 * Replaces: repository.listPullRequests (publicProcedure query → action)
 */
export const listPullRequests = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (_ctx, args) => {
    const owner = args.owner?.trim();
    const repo = args.repo?.trim();
    if (!(owner && repo)) return [];

    try {
      const octokit = await createOctokit();

      const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 50,
      });

      return data.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        user: pr.user?.login ?? '',
        html_url: pr.html_url,
        head_sha: pr.head.sha,
        updated_at: pr.updated_at,
      }));
    } catch {
      return [];
    }
  },
});
