// Dashboard related types
export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string | null;
  tags?: string[] | null;
  repositoryUrl?: string | null;
  issueUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  votes?: number;
  isFeatured?: boolean;
}

export interface UserData {
  id: string;
  name: string | null;
  handle: string | null;
  isProfilePrivate: boolean;
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

interface DashboardQueries {
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
  userData: {
    data?: UserData;
  };
}
