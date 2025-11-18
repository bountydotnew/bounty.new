import type { GitHubIssue, GitHubRepository } from '@bounty/types';
import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';

const MyOctokit = Octokit.plugin(restEndpointMethods);

// Top-level regex patterns for performance
const CO_AUTHOR_REGEX = /Co-authored-by:\s*(.+?)\s*<[^>]+>/g;
const NUMERIC_TERM_REGEX = /^\d+$/;
const GITHUB_ISSUE_URL_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i;
const CURRENCY_SYMBOL_REGEX = /[$€£]/;
const DOLLAR_PATTERN = /\$\s*(\d{1,13}(?:[.,]\d{1,2})?)/i;
const EURO_PATTERN = /€\s*(\d{1,13}(?:[.,]\d{1,2})?)/i;
const POUND_PATTERN = /£\s*(\d{1,13}(?:[.,]\d{1,2})?)/i;
const AMOUNT_CURRENCY_PATTERN = /\b(\d{1,13}(?:[.,]\d{1,2})?)\s*(usd|eur|gbp|dollars|pounds|euros)\b/i;
const CURRENCY_AMOUNT_PATTERN = /\b(usd|eur|gbp)\s*(\d{1,13}(?:[.,]\d{1,2})?)\b/i;
const DIGIT_PATTERN = /\d/;
const TRAILING_DOT_PATTERN = /\.$/;

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

export type UserRepo = {
  id: number;
  name: string;
  full_name?: string; // owner/repo format - more reliable than parsing URL
  description?: string;
  url: string;
  stargazersCount?: number;
  private?: boolean;
};

export type GetUserReposResult =
  | { success: true; data: UserRepo[] }
  | { success: false; error: string };

function parseRepo(identifier: string) {
  const [owner, repo] = identifier.split('/');
  if (!(owner && repo)) {
    throw new Error('Invalid repo id. Use owner/repo.');
  }
  return { owner, repo };
}

function parseCoAuthors(message: string): string[] {
  const out: string[] = [];
  // Reset regex lastIndex to ensure fresh search
  CO_AUTHOR_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null = CO_AUTHOR_REGEX.exec(message);
  while (m !== null) {
    const author = m[1];
    if (author) {
      out.push(author.trim());
    }
    m = CO_AUTHOR_REGEX.exec(message);
  }
  return out;
}

export class GithubManager {
  private octokit: InstanceType<typeof MyOctokit>;

  constructor(config: { token?: string } | string = {}) {
    const token = typeof config === 'string' ? config : config.token;
    const auth = token || process.env.GITHUB_TOKEN;
    this.octokit = new MyOctokit(auth ? { auth } : {});
  }

  async getRepoBasics(identifier: string): Promise<RepoBasics> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    const result: RepoBasics = {
      id: data.id,
      name: data.name,
      url: data.html_url,
      isPrivate: data.private,
      stargazersCount: data.stargazers_count,
      forksCount: data.forks_count,
      subscribersCount: data.subscribers_count,
      openIssuesCount: data.open_issues_count,
    };
    if (data.description !== null && data.description !== undefined) {
      result.description = data.description;
    }
    return result;
  }

  async getUserRepos(username: string): Promise<GetUserReposResult> {
    try {
      // listForUser only supports public repos and doesn't support affiliation/type params
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        per_page: 50,
        sort: 'pushed',
        type: 'all',
      });
      const repos: UserRepo[] = (data as GitHubRepository[]).map((r) => {
        const repo: UserRepo = {
        id: r.id,
        name: r.name,
        url: r.html_url,
        stargazersCount: r.stargazers_count,
        private: r.private,
        };
        if (r.description !== null && r.description !== undefined) {
          repo.description = r.description;
        }
        return repo;
      });
      return { success: true, data: repos };
    } catch (error) {
      // Fix: Return discriminated union with error information instead of empty array
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching repositories';
      return { success: false, error: errorMessage };
    }
  }

// Pagination requires sequential awaits - cannot use Promise.all
// eslint-disable-next-line @typescript-eslint/no-await-in-loop
async getAuthenticatedUserRepos(): Promise<GetUserReposResult> {
  try {
    // Fetch all repos with pagination to ensure we get organization repos
    const allRepos: GitHubRepository[] = [];
    const perPage = 100;
    const maxPages = 10; // Safety limit: max 1000 repos
    
    // Helper function to fetch a single page
    const fetchPage = async (pageNum: number): Promise<GitHubRepository[]> => {
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        per_page: perPage,
        page: pageNum,
        sort: 'pushed',
        affiliation: 'owner,collaborator,organization_member',
      });
      return data as GitHubRepository[];
    };

    // Fetch pages sequentially (required for pagination - each page depends on knowing if previous had more)
    for (let page = 1; page <= maxPages; page++) {
      // biome-ignore lint/nursery/noAwaitInLoop: Pagination requires sequential awaits - cannot use Promise.all
      const pageData = await fetchPage(page);

      if (pageData.length === 0) {
        break; // No more repos
      }
      
      allRepos.push(...pageData);
      
      // If we got fewer than perPage results, we've reached the end
      if (pageData.length < perPage) {
        break;
      }
    }
    
    // Filter to ONLY public repos - private repos don't align with open source mission
    const publicRepos = allRepos.filter((r) => !r.private);
    
      const repos: UserRepo[] = publicRepos.map((r) => {
        const repo: UserRepo = {
      id: r.id,
      name: r.name,
      full_name: r.full_name, // Include full_name (owner/repo) for reliable org repo handling
      url: r.html_url,
      stargazersCount: r.stargazers_count,
      private: r.private,
        };
        if (r.description !== null && r.description !== undefined) {
          repo.description = r.description;
        }
        return repo;
      });
    
    return { success: true, data: repos };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while fetching repositories';
    return { success: false, error: errorMessage };
  }
}

  async getAuthenticatedUser(): Promise<{ login: string } | null> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      return { login: data.login };
    } catch {
      return null;
    }
  }

  async searchIssues(
    owner: string,
    repo: string,
    q: string
  ): Promise<
    { number: number; title: string; state: string; html_url: string }[]
  > {
    try {
      const term = q.trim();
      const parts = [`repo:${owner}/${repo}`, 'is:issue'];
      if (term) {
        if (NUMERIC_TERM_REGEX.test(term)) {
          // Fix: Remove invalid 'in:number' qualifier and push bare number term
          parts.push(term);
        } else {
          parts.push(`in:title,body ${term}`);
        }
      }
      const { data } = await this.octokit.rest.search.issuesAndPullRequests({
        q: parts.join(' '),
        per_page: 10,
      });
      return data.items.map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        html_url: i.html_url,
      }));
    } catch {
      return [];
    }
  }

  async getContributors(
    identifier: string,
    perPage = 100
  ): Promise<Contributor[]> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: perPage,
    });
    const contributors: Contributor[] = [];
    for (const c of data) {
      if (
        c !== null &&
        c !== undefined &&
        typeof c.login === 'string' &&
        typeof c.avatar_url === 'string' &&
        typeof c.html_url === 'string' &&
        typeof c.contributions === 'number'
      ) {
        contributors.push({
      login: c.login,
      avatar_url: c.avatar_url,
      html_url: c.html_url,
      contributions: c.contributions,
        });
      }
    }
    return contributors;
  }

  async getOpenPRs(identifier: string): Promise<number> {
    const { owner, repo } = parseRepo(identifier);
    const { data: search } =
      await this.octokit.rest.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} is:pr is:open`,
        per_page: 1,
      });
    return search.total_count ?? 0;
  }

  async getBranches(identifier: string): Promise<string[]> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data.map((branch) => branch.name);
  }

  async getDefaultBranch(identifier: string): Promise<string> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return data.default_branch;
  }

  async getRecentCommits(identifier: string, perPage = 100) {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: perPage,
    });
    return data;
  }

  async getBiggestCommitByUser(
    identifier: string,
    username: string
  ): Promise<CommitLite | undefined> {
    const { owner, repo } = parseRepo(identifier);
    const { data: commits } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      author: username,
      per_page: 20,
    });
    let best: CommitLite | undefined;
    let max = 0;

    // Use Promise.all to avoid await in loop
    const commitDetails = await Promise.all(
      commits.slice(0, 10).map(async (c) => {
        if (!c.sha) {
          throw new Error('Commit SHA is missing');
        }
      const { data: detail } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/commits/{ref}',
        {
          owner,
          repo,
          ref: c.sha,
        }
      );
      const additions = detail.stats?.additions || 0;
      const deletions = detail.stats?.deletions || 0;
      const total = additions + deletions;
        const commitMessage = c.commit?.message || '';
        const htmlUrl = c.html_url;
        if (!htmlUrl) {
          throw new Error('Commit URL is missing');
        }
        const messageLines = String(commitMessage).split('\n');
        const firstLine = messageLines[0];
        if (!firstLine) {
          throw new Error('Commit message is empty');
        }
        return {
          sha: String(c.sha).slice(0, 7),
          message: firstLine.slice(0, 50),
          additions,
          deletions,
          coAuthors: parseCoAuthors(String(commitMessage)),
          url: htmlUrl,
          total,
        };
      })
    );

    for (const detail of commitDetails) {
      if (detail.total > max && detail.url) {
        max = detail.total;
        best = {
          sha: detail.sha,
          message: detail.message,
          additions: detail.additions,
          deletions: detail.deletions,
          coAuthors: detail.coAuthors,
          url: detail.url,
        };
      }
    }
    return best;
  }

  async getIssue(owner: string, repo: string, issueNumber: number) {
    const { data } = await this.octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return data;
  }

  async getIssueFromUrl(url: string) {
    const match = url.match(GITHUB_ISSUE_URL_REGEX);
    if (!match || match.length < 4) {
      throw new Error('Invalid GitHub issue URL');
    }
    const owner = match[1];
    const repo = match[2];
    const numStr = match[3];
    if (owner === undefined || repo === undefined || numStr === undefined) {
      throw new Error('Invalid GitHub issue URL');
    }
    const issue = await this.getIssue(owner, repo, Number(numStr));
    const bodyHtml = await this.renderMarkdown(
      issue.body || '',
      `${owner}/${repo}`
    );
    const { amount, currency } = this.extractAmountAndCurrency(
      `${issue.title}\n${issue.body || ''}`
    );
    return {
      owner,
      repo,
      number: Number(numStr),
      title: issue.title,
      body: issue.body || '',
      body_html: bodyHtml,
      html_url: issue.html_url,
      state: issue.state,
      detectedAmount: amount,
      detectedCurrency: currency,
      labels: Array.isArray(issue.labels)
        ? issue.labels
            .map((l) => (typeof l === 'string' ? l : l?.name))
            .filter(Boolean)
        : [],
      assignees: Array.isArray(issue.assignees)
        ? issue.assignees.map((a) => a?.login).filter(Boolean)
        : [],
    };
  }

  async getIssues(
    identifier: string
  ): Promise<{ id: number; title: string; state: string; url: string }[]> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });
    return (data as GitHubIssue[]).map((i) => ({
      id: i.id,
      title: i.title,
      state: i.state,
      url: i.html_url,
    }));
  }

  async listIssues(
    owner: string,
    repo: string
  ): Promise<{ number: number; title: string; state: string; updated_at: string; comments: number }[]> {
    try {
      const { data } = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 50,
      });
      return (data as GitHubIssue[]).map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        updated_at: i.updated_at,
        comments: i.comments || 0,
      }));
    } catch {
      return [];
    }
  }

  async renderMarkdown(markdown: string, context?: string): Promise<string> {
    if (!markdown) {
      return '';
    }
    const requestBody: {
      text: string;
      mode: 'gfm';
      context?: string;
    } = {
      text: markdown,
      mode: 'gfm',
    };
    if (context !== undefined) {
      requestBody.context = context;
    }
    const { data } = await this.octokit.request('POST /markdown', requestBody);
    return typeof data === 'string' ? data : '';
  }

  private detectCurrencyFromSymbols(text: string): string | undefined {
    if (!CURRENCY_SYMBOL_REGEX.test(text)) {
      return;
    }
    if (text.includes('$')) {
      return 'USD';
    }
    if (text.includes('€')) {
      return 'EUR';
    }
    if (text.includes('£')) {
      return 'GBP';
    }
    return;
  }

  private detectCurrencyFromText(lower: string): string | undefined {
    if (lower.includes('usd')) {
      return 'USD';
    }
    if (lower.includes('eur')) {
      return 'EUR';
    }
    if (lower.includes('gbp') || lower.includes('pound')) {
      return 'GBP';
    }
    return;
  }

  private normalizeAmount(value: string): string {
    let normalized = value.replace(/,/g, '.');
    if (normalized.includes('.')) {
      const [a, b = ''] = normalized.split('.');
      normalized = `${a}.${b.slice(0, 2)}`.replace(TRAILING_DOT_PATTERN, '');
    }
    return normalized;
  }

  private extractAmountFromMatch(m: RegExpMatchArray): string | undefined {
    if (m[1] && DIGIT_PATTERN.test(m[1])) {
      return m[1];
    }
    if (m[2] && DIGIT_PATTERN.test(m[2])) {
      return m[2];
    }
    return;
  }

  private extractCurrencyFromMatch(m: RegExpMatchArray): string | undefined {
    const cur = m[1] && !DIGIT_PATTERN.test(m[1]) ? m[1] : m[2];
    if (!cur) {
      return;
    }
    return cur.toString().toUpperCase();
  }

  private normalizeCurrency(cur: string | undefined): string | undefined {
    if (!cur) {
      return;
    }
    const curMap: Record<string, string> = {
      USD: 'USD',
      EUR: 'EUR',
      GBP: 'GBP',
      DOLLARS: 'USD',
      POUNDS: 'GBP',
      EUROS: 'EUR',
    };
    return curMap[cur] || cur;
  }

  private extractAmountAndCurrency(text: string): {
    amount?: string;
    currency?: string;
  } {
    if (!text) {
      return {};
    }
    const lower = text.toLowerCase();
    let currency = this.detectCurrencyFromSymbols(text);
    if (!currency) {
      currency = this.detectCurrencyFromText(lower);
      }

    const patterns: RegExp[] = [
      DOLLAR_PATTERN,
      EURO_PATTERN,
      POUND_PATTERN,
      AMOUNT_CURRENCY_PATTERN,
      CURRENCY_AMOUNT_PATTERN,
    ];

    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        const value = this.extractAmountFromMatch(m);
        if (value) {
          const normalizedValue = this.normalizeAmount(value);
          const extractedCur = this.extractCurrencyFromMatch(m);
          const normalizedCur = this.normalizeCurrency(extractedCur);
          const finalCurrency = normalizedCur || currency;
          const result: { amount?: string; currency?: string } = {
            amount: normalizedValue,
          };
          if (finalCurrency !== undefined) {
            result.currency = finalCurrency;
    }
          return result;
        }
      }
    }
    if (currency !== undefined) {
      return { currency };
    }
    return {};
  }
}
