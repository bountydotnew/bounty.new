export interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  handle: string | null;
  isProfilePrivate: boolean;
  createdAt: Date;
}

export interface ProfileData {
  bio: string | null;
  location: string | null;
  website: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
  linkedinUrl: string | null;
  skills: string[] | null;
  preferredLanguages: string[] | null;
  hourlyRate: string | null;
  currency: string | null;
  timezone: string | null;
  availableForWork: boolean | null;
}

export interface ProfileReputation {
  totalEarned: string | null;
  bountiesCompleted: number | null;
  bountiesCreated: number | null;
  averageRating: string | null;
  totalRatings: number | null;
  successRate: string | null;
  completionRate: string | null;
}

export interface ProfileResponse {
  user: ProfileUser;
  profile: ProfileData | null;
  reputation: ProfileReputation | null;
}

export interface GetProfileResponse {
  success: boolean;
  data: ProfileResponse;
  isPrivate: boolean;
}

export interface ActivityItem {
  type: 'bounty_created' | 'comment_created';
  id: string;
  title: string;
  createdAt: Date;
  data: {
    amount?: string;
    currency?: string;
    bountyId?: string;
    content?: string;
  };
}

export interface ProfileBounty {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  deadline: string | null;
  tags: string[] | null;
  repositoryUrl: string | null;
  issueUrl: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

