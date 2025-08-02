import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';

const MyOctokit = Octokit.plugin(restEndpointMethods);

export type RepoBasics = {
  id: number;
  name: string;
  description?: string;
  url: string;
  isPrivate: boolean;
  stargazersCount: number;
  forksCount: number;
  subscribersCount: number;
  openIssuesCount: number;
};

export type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

export type CommitLite = {
  sha: string;
  message: string;
  additions: number;
  deletions: number;
  url: string;
  coAuthors: string[];
};

function parseRepo(identifier: string) {
  const [owner, repo] = identifier.split('/');
  if (!owner || !repo) throw new Error('Invalid repo id. Use owner/repo.');
  return { owner, repo };
}

function parseCoAuthors(message: string): string[] {
  const coAuthorRegex = /Co-authored-by:\s*(.+?)\s*<[^>]+>/g;
  const out: string[] = [];
  let m;
  while ((m = coAuthorRegex.exec(message)) !== null) out.push(m[1].trim());
  return out;
}

export class GithubManager {
  private octokit: InstanceType<typeof MyOctokit>;

  constructor(config: { token?: string } | string = {}) {
    const token = typeof config === 'string' ? config : config.token;
    const auth = token || process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    this.octokit = new MyOctokit(auth ? { auth } : {});
  }

  async getRepoBasics(identifier: string): Promise<RepoBasics> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return {
      id: data.id,
      name: data.name,
      description: data.description ?? undefined,
      url: data.html_url,
      isPrivate: data.private,
      stargazersCount: data.stargazers_count,
      forksCount: data.forks_count,
      subscribersCount: data.subscribers_count,
      openIssuesCount: data.open_issues_count,
    };
  }

  async getContributors(identifier: string, perPage = 100): Promise<Contributor[]> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listContributors({ owner, repo, per_page: perPage });
    return data.map((c: any) => ({
      login: c.login,
      avatar_url: c.avatar_url,
      html_url: c.html_url,
      contributions: c.contributions,
    }));
  }

  async getOpenPRs(identifier: string): Promise<number> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.pulls.list({ owner, repo, state: 'open', per_page: 1 });
    const total = Number((Array.isArray((data as any)) ? (data as any).length : 0));
    return total;
  }

  async getRecentCommits(identifier: string, perPage = 100) {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listCommits({ owner, repo, per_page: perPage });
    return data as any[];
  }

  async getBiggestCommitByUser(identifier: string, username: string): Promise<CommitLite | undefined> {
    const { owner, repo } = parseRepo(identifier);
    const { data: commits } = await this.octokit.rest.repos.listCommits({ owner, repo, author: username, per_page: 20 });
    let best: CommitLite | undefined;
    let max = 0;
    for (const c of commits.slice(0, 10)) {
      const { data: detail } = await this.octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner,
        repo,
        ref: c.sha,
      });
      const additions = detail.stats?.additions || 0;
      const deletions = detail.stats?.deletions || 0;
      const total = additions + deletions;
      if (total > max) {
        max = total;
        best = {
          sha: String(c.sha).slice(0, 7),
          message: String(c.commit?.message || '').split('\n')[0].slice(0, 50),
          additions,
          deletions,
          coAuthors: parseCoAuthors(String(c.commit?.message || '')),
          url: c.html_url,
        };
      }
    }
    return best;
  }
}
