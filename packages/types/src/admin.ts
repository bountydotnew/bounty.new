export interface AdminPlatformStats {
  totalUsers: number;
}

export interface AdminUserMetrics {
  totalEarned: string;
  bountiesCompleted: number;
  bountiesCreated: number;
  averageRating: string;
  totalRatings: number;
  successRate: string;
  completionRate: string;
  responseTime: number | null;
}

export interface AdminUserStatsResponse {
  success: boolean;
  data: {
    platformStats: AdminPlatformStats;
    userStats: AdminUserMetrics;
  };
}

export interface AdminUserProfileMetrics {
  bountiesCreated: number;
}

export interface AdminUserSessionSummary {
  id: string;
  createdAt: string | Date;
  expiresAt: string | Date | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AdminUserProfileResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role?: string | null;
    hasAccess: boolean;
    betaAccessStatus?: string | null;
    banned?: boolean | null;
    createdAt: string | Date;
  };
  metrics: AdminUserProfileMetrics;
  sessions: AdminUserSessionSummary[];
}
