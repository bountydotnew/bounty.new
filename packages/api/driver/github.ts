import { Octokit } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";

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

export type UserRepo = {
  id: number;
  name: string;
  description?: string;
  url: string;
  stargazersCount?: number;
  private?: boolean;
};

function parseRepo(identifier: string) {
  const [owner, repo] = identifier.split("/");
  if (!owner || !repo) throw new Error("Invalid repo id. Use owner/repo.");
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
    const token = typeof config === "string" ? config : config.token;
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

  async getUserRepos(username: string): Promise<UserRepo[]> {
    try {
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        per_page: 50,
        sort: "pushed",
      });
      return (data as any[]).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        url: r.html_url,
        stargazersCount: r.stargazers_count,
        private: r.private,
      }));
    } catch {
      return [];
    }
  }

  async searchIssues(owner: string, repo: string, q: string): Promise<{ number: number; title: string; state: string; html_url: string }[]> {
    try {
      const term = q.trim();
      const parts = [`repo:${owner}/${repo}`, `is:issue`];
      if (term) {
        if (/^\d+$/.test(term)) {
          parts.push(`in:number ${term}`);
        } else {
          parts.push(`in:title,body ${term}`);
        }
      }
      const { data } = await this.octokit.rest.search.issuesAndPullRequests({
        q: parts.join(" "),
        per_page: 10,
      });
      return data.items.map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        html_url: i.html_url,
      }));
    } catch {
      return [];
    }
  }

  async getContributors(identifier: string, perPage = 100): Promise<Contributor[]> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: perPage,
    });
    return data.map((c: any) => ({
      login: c.login,
      avatar_url: c.avatar_url,
      html_url: c.html_url,
      contributions: c.contributions,
    }));
  }

  async getOpenPRs(identifier: string): Promise<number> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: "open",
      per_page: 1,
    });
    const total = Number(Array.isArray(data as any) ? (data as any).length : 0);
    return total;
  }

  async getRecentCommits(identifier: string, perPage = 100) {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: perPage,
    });
    return data as any[];
  }

  async getBiggestCommitByUser(identifier: string, username: string): Promise<CommitLite | undefined> {
    const { owner, repo } = parseRepo(identifier);
    const { data: commits } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      author: username,
      per_page: 20,
    });
    let best: CommitLite | undefined;
    let max = 0;
    for (const c of commits.slice(0, 10)) {
      const { data: detail } = await this.octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
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
          message: String(c.commit?.message || "").split("\n")[0].slice(0, 50),
          additions,
          deletions,
          coAuthors: parseCoAuthors(String(c.commit?.message || "")),
          url: c.html_url,
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
    const match = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/i);
    if (!match) throw new Error("Invalid GitHub issue URL");
    const [, owner, repo, num] = match;
    const issue = await this.getIssue(owner, repo, Number(num));
    const bodyHtml = await this.renderMarkdown(issue.body || "", `${owner}/${repo}`);
    const { amount, currency } = this.extractAmountAndCurrency(`${issue.title}\n${issue.body || ""}`);
    return {
      owner,
      repo,
      number: Number(num),
      title: issue.title,
      body: issue.body || "",
      body_html: bodyHtml,
      html_url: issue.html_url,
      state: issue.state,
      detectedAmount: amount,
      detectedCurrency: currency,
      labels: Array.isArray(issue.labels) ? (issue.labels as any[]).map((l: any) => (typeof l === "string" ? l : l?.name)).filter(Boolean) : [],
      assignees: Array.isArray(issue.assignees) ? (issue.assignees as any[]).map((a: any) => a?.login).filter(Boolean) : [],
    };
  }

  async getIssues(identifier: string): Promise<{ id: number; title: string; state: string; url: string }[]> {
    const { owner, repo } = parseRepo(identifier);
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });
    return (data as any[]).map((i: any) => ({
      id: i.id,
      title: i.title,
      state: i.state,
      url: i.html_url,
    }));
  }

  async renderMarkdown(markdown: string, context?: string): Promise<string> {
    if (!markdown) return "";
    const { data } = await this.octokit.request("POST /markdown", {
      text: markdown,
      mode: "gfm",
      context,
    } as any);
    return typeof data === "string" ? data : "";
  }

  private extractAmountAndCurrency(text: string): { amount?: string; currency?: string } {
    if (!text) return {};
    const lower = text.toLowerCase();
    let currency: string | undefined;
    if (/[\$€£]/.test(text)) {
      if (text.includes("$")) currency = "USD";
      else if (text.includes("€")) currency = "EUR";
      else if (text.includes("£")) currency = "GBP";
    }
    if (!currency) {
      if (lower.includes("usd")) currency = "USD";
      else if (lower.includes("eur")) currency = "EUR";
      else if (lower.includes("gbp") || lower.includes("pound")) currency = "GBP";
    }
    const patterns: RegExp[] = [
      /\$\s*(\d{1,13}(?:[.,]\d{1,2})?)/i,
      /€\s*(\d{1,13}(?:[.,]\d{1,2})?)/i,
      /£\s*(\d{1,13}(?:[.,]\d{1,2})?)/i,
      /\b(\d{1,13}(?:[.,]\d{1,2})?)\s*(usd|eur|gbp|dollars|pounds|euros)\b/i,
      /\b(usd|eur|gbp)\s*(\d{1,13}(?:[.,]\d{1,2})?)\b/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        let value: string | undefined;
        if (m[1] && /\d/.test(m[1])) value = m[1];
        else if (m[2] && /\d/.test(m[2])) value = m[2];
        if (value) {
          value = value.replace(/,/g, ".");
          if (value.includes(".")) {
            const [a, b = ""] = value.split(".");
            value = `${a}.${b.slice(0, 2)}`.replace(/\.$/, "");
          }
          const cur = (m[1] && !/\d/.test(m[1]) ? m[1] : m[2]) || undefined;
          const normCur = cur ? cur.toString().toUpperCase() : undefined;
          const curMap: Record<string, string> = {
            USD: "USD",
            EUR: "EUR",
            GBP: "GBP",
            DOLLARS: "USD",
            POUNDS: "GBP",
            EUROS: "EUR",
          };
          return { amount: value, currency: curMap[normCur || ""] || currency };
        }
      }
    }
    return currency ? { currency } : {};
  }
}