// Dashboard related types
export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  creator?: {
    name?: string;
  };
}

export interface UserData {
  name?: string;
  betaAccessStatus: 'none' | 'pending' | 'approved' | 'denied';
  accessStage: 'none' | 'alpha' | 'beta' | 'production';
}

export interface BetaSubmission {
  hasSubmitted: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'comment' | 'completion' | 'payment';
  title: string;
  description: string;
  timestamp: string;
}

export interface RecommendedBounty {
  id: string;
  title: string;
  description: string;
  technology: string;
  amount: number;
}

export interface DashboardQueries {
  bounties: {
    data?: { data: Bounty[] };
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
  };
  myBounties: {
    data?: { data: Bounty[] };
    isLoading: boolean;
    refetch: () => void;
  };
  existingSubmission: {
    data?: BetaSubmission;
    refetch: () => void;
  };
  userData: {
    data?: UserData;
  };
}