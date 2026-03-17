import type {
  GithubManager,
  ContributorDossier,
} from '@bounty/api/driver/github';
import { RedisCache } from './redis-cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoreInput {
  followers: number;
  publicRepos: number;
  accountCreated: string;
  commitsInRepo: number;
  prsInRepo: { state: string }[];
  reviewsInRepo: number;
  isContributor: boolean;
  contributionCount: number;
  isOrgMember: boolean;
  isOwner: boolean;
  topRepoStars: number[];
}

export interface ScoreResult {
  total: number;
  repoFamiliarity: number;
  communityStanding: number;
  ossInfluence: number;
  prTrackRecord: number;
}

// ---------------------------------------------------------------------------
// Redis cache — 1 hour TTL, keyed by owner/repo/username
// ---------------------------------------------------------------------------

const scoreCache = new RedisCache<ScoreResult>({
  prefix: 'contributor-score',
  ttl: 3600, // 1 hour
});

function cacheKey(
  repoOwner: string | null | undefined,
  repoName: string | null | undefined,
  githubUsername: string
): string {
  const repo =
    repoOwner && repoName
      ? `${repoOwner.toLowerCase()}/${repoName.toLowerCase()}`
      : '_no-repo_';
  return `${repo}/${githubUsername.toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// Pure scoring functions
// ---------------------------------------------------------------------------

function accountAgeMonths(created: string): number {
  return (Date.now() - new Date(created).getTime()) / 2.628e9;
}

function scoreRepoFamiliarity(input: ScoreInput): number {
  let s = 0;
  const c = input.commitsInRepo;
  s += c === 0 ? 0 : c <= 5 ? 3 : c <= 20 ? 7 : 10;
  const merged = input.prsInRepo.filter((p) => p.state === 'merged').length;
  s +=
    merged === 0
      ? 0
      : merged === 1
        ? 3
        : merged <= 5
          ? 6
          : merged <= 15
            ? 9
            : 12;
  const r = input.reviewsInRepo;
  s += r === 0 ? 0 : r <= 3 ? 3 : r <= 10 ? 5 : 8;
  if (input.isContributor) s += 5;
  return Math.min(s, 35);
}

function scoreCommunityStanding(input: ScoreInput): number {
  let s = 0;
  const months = accountAgeMonths(input.accountCreated);
  s += months < 3 ? 0 : months < 12 ? 2 : months < 36 ? 3 : months < 84 ? 4 : 5;
  const f = input.followers;
  s += f < 10 ? 1 : f < 50 ? 3 : f < 200 ? 5 : f < 1000 ? 7 : 10;
  if (input.isOrgMember) s += 10;
  return Math.min(s, 25);
}

function scoreOSSInfluence(input: ScoreInput): number {
  let s = 0;
  const stars = input.topRepoStars;
  const max = stars.length > 0 ? Math.max(...stars) : 0;
  s += max === 0 ? 0 : max <= 50 ? 3 : max <= 500 ? 6 : max <= 5000 ? 12 : 15;
  const total = stars.reduce((a, b) => a + b, 0);
  s += total < 50 ? 0 : total < 500 ? 2 : 5;
  return Math.min(s, 20);
}

function scorePRTrackRecord(input: ScoreInput): number {
  const prs = input.prsInRepo;
  if (prs.length === 0) return 5;
  const merged = prs.filter((p) => p.state === 'merged').length;
  const resolved = prs.filter(
    (p) => p.state === 'merged' || p.state === 'closed'
  ).length;
  if (resolved === 0) return 5;
  const rate = (merged / resolved) * 100;
  return rate === 0 ? 0 : rate < 50 ? 5 : rate < 75 ? 10 : rate < 90 ? 15 : 20;
}

export function computeContributorScore(input: ScoreInput): ScoreResult {
  if (input.isOwner || input.isOrgMember) {
    return {
      total: 100,
      repoFamiliarity: 35,
      communityStanding: 25,
      ossInfluence: 20,
      prTrackRecord: 20,
    };
  }

  const repoFamiliarity = scoreRepoFamiliarity(input);
  const communityStanding = scoreCommunityStanding(input);
  const ossInfluence = scoreOSSInfluence(input);
  const prTrackRecord = scorePRTrackRecord(input);

  return {
    total: repoFamiliarity + communityStanding + ossInfluence + prTrackRecord,
    repoFamiliarity,
    communityStanding,
    ossInfluence,
    prTrackRecord,
  };
}

// ---------------------------------------------------------------------------
// Dossier → ScoreInput mapper
// ---------------------------------------------------------------------------

function dossierToScoreInput(
  dossier: ContributorDossier,
  githubUsername: string,
  repoOwner?: string | null,
  repoName?: string | null
): ScoreInput {
  const hasRepo = !!(repoOwner && repoName);
  const isOrgMember = hasRepo
    ? dossier.orgs.some((o) => o.toLowerCase() === repoOwner!.toLowerCase())
    : false;

  const prsInRepo = [
    ...Array(dossier.mergedPrs).fill({ state: 'merged' }),
    ...Array(dossier.closedPrs).fill({ state: 'closed' }),
    ...Array(dossier.openPrs).fill({ state: 'open' }),
  ] as { state: string }[];

  const contributionCount = dossier.mergedPrs + dossier.reviewCount;

  return {
    followers: dossier.followers,
    publicRepos: dossier.publicRepos,
    accountCreated: dossier.accountCreated,
    commitsInRepo: dossier.mergedPrs, // merged PRs as commit proxy
    prsInRepo,
    reviewsInRepo: dossier.reviewCount,
    isContributor: contributionCount > 0,
    contributionCount,
    isOrgMember,
    isOwner: hasRepo
      ? repoOwner!.toLowerCase() === githubUsername.toLowerCase()
      : false,
    topRepoStars: dossier.topRepoStars,
  };
}

// ---------------------------------------------------------------------------
// Public API — fetch + score + cache
// ---------------------------------------------------------------------------

/**
 * Fetch GitHub data for a contributor and compute their trust score.
 *
 * Delegates the GitHub API call to `GithubManager.getContributorDossier()`
 * (single GraphQL query) and caches the computed score in Redis for 1 hour.
 */
export async function fetchContributorScore(
  githubUsername: string,
  repoOwner: string | null | undefined,
  repoName: string | null | undefined,
  github: GithubManager
): Promise<ScoreResult | null> {
  try {
    // 1. Check cache
    const key = cacheKey(repoOwner, repoName, githubUsername);
    const cached = await scoreCache.get(key);
    if (cached) return cached;

    // 2. Fetch dossier from GitHub (single GraphQL call)
    const dossier = await github.getContributorDossier(
      githubUsername,
      repoOwner,
      repoName
    );
    if (!dossier) return null;

    // 3. Score
    const input = dossierToScoreInput(
      dossier,
      githubUsername,
      repoOwner,
      repoName
    );
    const score = computeContributorScore(input);

    // 4. Cache
    await scoreCache.set(key, score);
    return score;
  } catch {
    return null;
  }
}

/**
 * Batch-fetch contributor scores for multiple GitHub usernames.
 * Checks Redis cache first, then fires GraphQL calls only for cache misses.
 */
export async function fetchContributorScores(
  githubUsernames: (string | null)[],
  repoOwner: string | null | undefined,
  repoName: string | null | undefined,
  github: GithubManager
): Promise<(ScoreResult | null)[]> {
  return Promise.all(
    githubUsernames.map((username) =>
      username
        ? fetchContributorScore(username, repoOwner, repoName, github)
        : Promise.resolve(null)
    )
  );
}
