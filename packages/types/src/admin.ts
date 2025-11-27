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

