// Analytics types
export interface EventsByDateRow {
  date: string;
  count: number;
}

export interface SummaryMetricsRow {
  totalEvents: number;
  uniqueVisitors: number;
  pageViews: number;
  sessions: number;
  averageSessionDuration: number;
  bounceRate: number;
}

export interface KpiSeriesPoint {
  date: string;
  value: number;
  previousValue?: number;
}

export interface Kpi {
  title: string;
  value: number;
  change: number;
  series: KpiSeriesPoint[];
}

// Stat card types
export interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

// Compose form types
export interface ComposeFormProps {
  onSend: (data: NotificationComposeData) => void;
  disabled?: boolean;
}

export interface NotificationComposeData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipients: string[];
  linkTo?: string;
}

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string | Date;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
};

export type AdminListUsersResponse = {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
};
