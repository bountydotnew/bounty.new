import type { GithubManager, ProfileDossier } from '@bounty/api/driver/github';
import { RedisCache } from './redis-cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileScoreInput {
  followers: number;
  following: number;
  publicRepos: number;
  accountCreated: string;
  hasBio: boolean;
  totalStars: number;
  topRepoStars: number;
  totalForks: number;
  totalContributions: number;
  orgCount: number;
  languageCount: number;
}

export interface ProfileScoreResult {
  total: number; // 0-100
  communityPresence: number; // 0-25
  ossImpact: number; // 0-25
  activity: number; // 0-30
  ecosystem: number; // 0-20
}

// ---------------------------------------------------------------------------
// Redis cache — 1 hour TTL, keyed by username
// ---------------------------------------------------------------------------

const profileScoreCache = new RedisCache<ProfileScoreResult>({
  prefix: 'profile-score',
  ttl: 3600, // 1 hour
});

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function accountAgeYears(created: string): number {
  return (Date.now() - new Date(created).getTime()) / 3.154e10;
}

/** Logarithmic scaling: maps a value to 0-max using log curve.
 *  `ref` is the reference value that maps to ~70% of max. */
function logScale(value: number, ref: number, max: number): number {
  if (value <= 0) return 0;
  const normalized = Math.log1p(value) / Math.log1p(ref);
  return Math.min(Math.round(normalized * max * 0.7), max);
}

// ---------------------------------------------------------------------------
// Category scorers
// ---------------------------------------------------------------------------

function scoreCommunityPresence(input: ProfileScoreInput): number {
  let s = 0;

  // Account age (0-5)
  const years = accountAgeYears(input.accountCreated);
  s += years < 1 ? 1 : years < 3 ? 2 : years < 6 ? 3 : years < 10 ? 4 : 5;

  // Followers (0-12): log scale, ref=200
  s += logScale(input.followers, 200, 12);

  // Follower/following ratio (0-4)
  const ratio =
    input.following > 0
      ? input.followers / input.following
      : input.followers > 0
        ? 10
        : 0;
  s += ratio < 0.5 ? 0 : ratio < 1 ? 1 : ratio < 3 ? 2 : ratio < 10 ? 3 : 4;

  // Has bio (0-4)
  if (input.hasBio) s += 4;

  return Math.min(s, 25);
}

function scoreOSSImpact(input: ProfileScoreInput): number {
  let s = 0;

  // Top repo stars (0-10): log scale, ref=500
  s += logScale(input.topRepoStars, 500, 10);

  // Total stars (0-10): log scale, ref=500
  s += logScale(input.totalStars, 500, 10);

  // Total forks (0-5): log scale, ref=100
  s += logScale(input.totalForks, 100, 5);

  return Math.min(s, 25);
}

function scoreActivity(input: ProfileScoreInput): number {
  let s = 0;

  // Yearly contributions (0-18): log scale, ref=800
  s += logScale(input.totalContributions, 800, 18);

  // Public repos (0-12): log scale, ref=50
  s += logScale(input.publicRepos, 50, 12);

  return Math.min(s, 30);
}

function scoreEcosystem(input: ProfileScoreInput): number {
  let s = 0;

  // Org memberships (0-12)
  const o = input.orgCount;
  s += o === 0 ? 0 : o === 1 ? 3 : o <= 3 ? 6 : o <= 7 ? 9 : 12;

  // Language diversity (0-8)
  const l = input.languageCount;
  s += l <= 1 ? 0 : l === 2 ? 2 : l <= 4 ? 4 : l <= 7 ? 6 : 8;

  return Math.min(s, 20);
}

export function computeProfileScore(
  input: ProfileScoreInput
): ProfileScoreResult {
  const communityPresence = scoreCommunityPresence(input);
  const ossImpact = scoreOSSImpact(input);
  const activity = scoreActivity(input);
  const ecosystem = scoreEcosystem(input);

  return {
    total: communityPresence + ossImpact + activity + ecosystem,
    communityPresence,
    ossImpact,
    activity,
    ecosystem,
  };
}

// ---------------------------------------------------------------------------
// Dossier → ScoreInput mapper
// ---------------------------------------------------------------------------

function dossierToProfileScoreInput(
  dossier: ProfileDossier
): ProfileScoreInput {
  return {
    followers: dossier.followers,
    following: dossier.following,
    publicRepos: dossier.publicRepos,
    accountCreated: dossier.accountCreated,
    hasBio: dossier.hasBio,
    totalStars: dossier.totalStars,
    topRepoStars: dossier.topRepoStars,
    totalForks: dossier.totalForks,
    totalContributions: dossier.totalContributions,
    orgCount: dossier.orgCount,
    languageCount: dossier.languageCount,
  };
}

// ---------------------------------------------------------------------------
// Public API — fetch + score + cache
// ---------------------------------------------------------------------------

/**
 * Fetch a GitHub user's profile data and compute their trust score.
 *
 * Unlike the contributor score (which is repo-scoped), this is a global
 * profile-level score based on overall GitHub presence. It shows regardless
 * of whether the bounty.new profile is private.
 */
export async function fetchProfileScore(
  githubUsername: string,
  github: GithubManager
): Promise<ProfileScoreResult | null> {
  const result = await fetchProfileScoreWithDossier(githubUsername, github);
  return result?.score ?? null;
}

/**
 * Same as fetchProfileScore but also returns the raw dossier data
 * for display in preview cards (followers, repos, join date, etc.)
 */
export async function fetchProfileScoreWithDossier(
  githubUsername: string,
  github: GithubManager
): Promise<{ score: ProfileScoreResult; dossier: ProfileDossier } | null> {
  try {
    const key = githubUsername.toLowerCase();

    const dossier = await github.getProfileDossier(githubUsername);
    if (!dossier) return null;

    // Check score cache
    const cachedScore = await profileScoreCache.get(key);
    if (cachedScore) return { score: cachedScore, dossier };

    const input = dossierToProfileScoreInput(dossier);
    const score = computeProfileScore(input);

    await profileScoreCache.set(key, score);
    return { score, dossier };
  } catch {
    return null;
  }
}
