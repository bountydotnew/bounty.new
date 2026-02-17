// Analytics types
interface EventsByDateRow {
  date: string;
  count: number;
}

interface SummaryMetricsRow {
  totalEvents: number;
  uniqueVisitors: number;
  pageViews: number;
  sessions: number;
  averageSessionDuration: number;
  bounceRate: number;
}

interface KpiSeriesPoint {
  date: string;
  value: number;
  previousValue?: number;
}

interface Kpi {
  title: string;
  value: number;
  change: number;
  series: KpiSeriesPoint[];
}

// Compose form types
interface ComposeFormProps {
  onSend: (data: NotificationComposeData) => void;
  disabled?: boolean;
}

interface NotificationComposeData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipients: string[];
  linkTo?: string;
}
