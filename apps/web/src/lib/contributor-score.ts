export interface ScoreInput {
  // profile
  followers: number;
  publicRepos: number;
  accountCreated: string;
  // repo activity
  commitsInRepo: number;
  prsInRepo: { state: string }[]; // state: "merged" | "open" | "closed"
  reviewsInRepo: number;
  isContributor: boolean;
  contributionCount: number;
  isOrgMember: boolean;
  isOwner: boolean;
  // oss
  topRepoStars: number[]; // star counts of their top repos
}

export interface ScoreResult {
  total: number; // 0-100
  repoFamiliarity: number; // 0-35
  communityStanding: number; // 0-25
  ossInfluence: number; // 0-20
  prTrackRecord: number; // 0-20
}

function accountAgeMonths(created: string): number {
  return (Date.now() - new Date(created).getTime()) / 2.628e9;
}

function scoreRepoFamiliarity(input: ScoreInput): number {
  let s = 0;

  // Commits: 0=0, 1-5=3, 6-20=7, 20+=10
  const c = input.commitsInRepo;
  s += c === 0 ? 0 : c <= 5 ? 3 : c <= 20 ? 7 : 10;

  // Merged PRs: 0=0, 1=3, 2-5=6, 6-15=9, 15+=12
  const merged = input.prsInRepo.filter((p) => p.state === 'merged').length;
  s += merged === 0 ? 0 : merged === 1 ? 3 : merged <= 5 ? 6 : merged <= 15 ? 9 : 12;

  // Reviews: 0=0, 1-3=3, 4-10=5, 10+=8
  const r = input.reviewsInRepo;
  s += r === 0 ? 0 : r <= 3 ? 3 : r <= 10 ? 5 : 8;

  // Is listed contributor: yes=5, no=0
  if (input.isContributor) s += 5;

  return Math.min(s, 35);
}

function scoreCommunityStanding(input: ScoreInput): number {
  let s = 0;

  // Account age: <3mo=0, 3mo-1y=2, 1-3y=3, 3-7y=4, 7+=5
  const months = accountAgeMonths(input.accountCreated);
  s += months < 3 ? 0 : months < 12 ? 2 : months < 36 ? 3 : months < 84 ? 4 : 5;

  // Followers: 0-10=1, 10-50=3, 50-200=5, 200-1k=7, 1k+=10
  const f = input.followers;
  s += f < 10 ? 1 : f < 50 ? 3 : f < 200 ? 5 : f < 1000 ? 7 : 10;

  // Org member: yes=10, no=0
  if (input.isOrgMember) s += 10;

  return Math.min(s, 25);
}

function scoreOSSInfluence(input: ScoreInput): number {
  let s = 0;
  const stars = input.topRepoStars;

  // Max stars: 0=0, 1-50=3, 50-500=6, 500-5k=12, 5k+=15
  const max = stars.length > 0 ? Math.max(...stars) : 0;
  s += max === 0 ? 0 : max <= 50 ? 3 : max <= 500 ? 6 : max <= 5000 ? 12 : 15;

  // Total stars: 0-50=0, 50-500=2, 500+=5
  const total = stars.reduce((a, b) => a + b, 0);
  s += total < 50 ? 0 : total < 500 ? 2 : 5;

  return Math.min(s, 20);
}

function scorePRTrackRecord(input: ScoreInput): number {
  const prs = input.prsInRepo;
  if (prs.length === 0) return 5; // neutral for first-time contributors

  const merged = prs.filter((p) => p.state === 'merged').length;
  // Only count closed (not merged) + merged as "resolved"
  const resolved = prs.filter(
    (p) => p.state === 'merged' || p.state === 'closed'
  ).length;
  if (resolved === 0) return 5; // all still open, neutral

  const rate = (merged / resolved) * 100;
  return rate === 0 ? 0 : rate < 50 ? 5 : rate < 75 ? 10 : rate < 90 ? 15 : 20;
}

export function computeContributorScore(input: ScoreInput): ScoreResult {
  // Owners and org members are fully trusted
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
