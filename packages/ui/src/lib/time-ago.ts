export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return diffSec <= 5 ? 'now' : `${diffSec}s ago`;
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  if (diffHr < 24) {
    return `${diffHr}h ago`;
  }
  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }
  if (diffWeek < 4) {
    return `${diffWeek}w ago`;
  }
  if (diffMonth < 12) {
    return `${diffMonth}mo ago`;
  }
  return `${diffYear}y ago`;
}
