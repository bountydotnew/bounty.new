import { GithubManager } from '@bounty/api/driver/github';

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

function accountAgeMonths(created: string): number {
  return (Date.now() - new Date(created).getTime()) / 2.628e9;
}

function scoreRepoFamiliarity(input: ScoreInput): number {
  let s = 0;
  const c = input.commitsInRepo;
  s += c === 0 ? 0 : c <= 5 ? 3 : c <= 20 ? 7 : 10;
  const merged = input.prsInRepo.filter((p) => p.state === 'merged').length;
  s += merged === 0 ? 0 : merged === 1 ? 3 : merged <= 5 ? 6 : merged <= 15 ? 9 : 12;
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

/**
 * Fetch GitHub data for a contributor and compute their score.
 * Returns null if any critical data fetch fails.
 */
export async function fetchContributorScore(
  githubUsername: string,
  repoOwner: string,
  repoName: string,
  github: GithubManager
): Promise<ScoreResult | null> {
  try {
    const identifier = `${repoOwner}/${repoName}`;

    // Fetch data in parallel for efficiency
    const [userProfile, userRepos, contributors, commitsByUser, prSearch] =
      await Promise.all([
        // 1. User profile (followers, public_repos, created_at)
        github
          .getUserProfile(githubUsername)
          .catch(() => null),

        // 2. User's top repos by stars
        github
          .getUserRepos(githubUsername)
          .then((r) => (r.success ? r.data : []))
          .catch(() => []),

        // 3. Repo contributors (check if user is listed)
        github
          .getContributors(identifier)
          .catch(() => []),

        // 4. Commits by user in this repo
        github
          .getCommitCountByUser(identifier, githubUsername)
          .catch(() => 0),

        // 5. PRs by user in this repo (all states)
        github
          .searchUserPRsInRepo(repoOwner, repoName, githubUsername)
          .catch(() => []),
      ]);

    if (!userProfile) return null;

    const contributor = contributors.find(
      (c) => c.login.toLowerCase() === githubUsername.toLowerCase()
    );

    const topRepoStars = userRepos
      .map((r) => r.stargazersCount ?? 0)
      .sort((a, b) => b - a)
      .slice(0, 10);

    const input: ScoreInput = {
      followers: userProfile.followers,
      publicRepos: userProfile.public_repos,
      accountCreated: userProfile.created_at,
      commitsInRepo: commitsByUser,
      prsInRepo: prSearch,
      reviewsInRepo: 0, // Reviews require authenticated search; omit for now
      isContributor: !!contributor,
      contributionCount: contributor?.contributions ?? 0,
      isOrgMember: false, // Checked separately if needed
      isOwner: repoOwner.toLowerCase() === githubUsername.toLowerCase(),
      topRepoStars,
    };

    return computeContributorScore(input);
  } catch {
    return null;
  }
}
