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
