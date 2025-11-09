'use client';

import { BellIcon } from '@bounty/ui/components/bell';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { cn } from '@bounty/ui/lib/utils';
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUpRight,
  Award,
  Bell,
  CheckCircle2,
  FilePlus2,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import type { NotificationData, NotificationItem, NotificationRowProps } from '@/types/notifications';
import { authClient } from '@bounty/auth/client';
import { useAccess } from '@/context/access-provider';
import styles from './notifications-dropdown.styles';

const ICONS_MAP: Record<
  string,
  { component: typeof Bell; color: string }
> = {
  bounty_comment: { component: MessageSquare, color: 'text-green-400' },
  submission_received: { component: FilePlus2, color: 'text-blue-400' },
  submission_approved: { component: CheckCircle2, color: 'text-emerald-400' },
  submission_rejected: { component: XCircle, color: 'text-red-400' },
  bounty_awarded: { component: Award, color: 'text-yellow-400' },
};

function Row({ item, onRead }: NotificationRowProps) {
  const router = useRouter();
  const ts =
    typeof item.createdAt === 'string'
      ? new Date(item.createdAt)
      : item.createdAt;
  const timeAgo = formatDistanceToNow(ts, { addSuffix: false });
  const displayTime = timeAgo.includes('less than') ? 'now' : timeAgo;

  const handleClick = useCallback(() => {
    if (!item.read) {
      onRead(item.id);
    }
    const data = (item.data || {}) as NotificationData;
    if (typeof data.linkTo === 'string' && data.linkTo.length > 0) {
      router.push(String(data.linkTo));
      return;
    }
    if (item.type === 'bounty_comment' && typeof data.bountyId === 'string') {
      router.push(`/bounty/${data.bountyId}`);
      return;
    }
    if (
      item.type === 'submission_received' &&
      typeof data.bountyId === 'string'
    ) {
      router.push(`/bounty/${data.bountyId}`);
      return;
    }
    if (item.type === 'bounty_awarded' && typeof data.bountyId === 'string') {
      router.push(`/bounty/${data.bountyId}`);
      return;
    }
  }, [item.id, item.read, item.type, item.data, onRead, router]);

  const Icon = ICONS_MAP[item.type]?.component || Bell;
  const iconColor = ICONS_MAP[item.type]?.color || 'text-neutral-400';

  return (
    <button
      type="button"
      className={styles.ROW_BASE}
      onClick={handleClick}
    >
      <div className={styles.ICON_CONTAINER}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className={cn(styles.TITLE_BASE, item.read ? styles.TITLE_READ : styles.TITLE_UNREAD)}>
              {item.title}
            </div>
            <div className={styles.MESSAGE_CLASS}>
              {item.message}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className={styles.TIME_CLASS}>
              {displayTime}
            </span>
            {!item.read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
          </div>
        </div>
      </div>
    </button>
  );
}

// biome-ignore lint: UI component with conditional rendering
export function NotificationsDropdown() {
  const { data: session } = authClient.useSession();
  const { hasStageAccess } = useAccess();
  const enabled = Boolean(session) && hasStageAccess(['beta', 'production']);

  // Don't show notifications dropdown if user doesn't have access
  if (!enabled) {
    return null;
  }

  const {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotificationsRealtime();
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () => (showAll ? notifications : notifications.filter((n) => !n.read)),
    [notifications, showAll]
  );
  const showCaughtUp =
    unreadCount === 0 && notifications.length > 0 && !showAll;

  return (
    <DropdownMenu onOpenChange={(open) => !open && setShowAll(false)}>
      <DropdownMenuTrigger asChild>
        <Button
          className="relative rounded-none border-0 p-2 text-neutral-400 text-sm hover:bg-neutral-900 hover:text-white"
          size="sm"
          variant="text"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-green-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={-8}
        className="ml-2 w-80 rounded-lg border border-neutral-800 bg-neutral-900 p-0 sm:ml-4 sm:w-96"
        side="bottom"
        sideOffset={4}
      >
        <div className={styles.HEADER_SECTION}>
          <div className={styles.HEADER_ROW}>
            <div className={styles.ROW_ITEMS_CENTER}>
              <h3 className={styles.TITLE_H3}>Notifications</h3>
              <span className={styles.BADGE}>{unreadCount}</span>
            </div>
            <div className={styles.ROW_ITEMS_CENTER}>
              <Button className={styles.HEADER_BTN} onClick={refetch} variant="text">
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  className={cn(styles.HEADER_BTN, 'gap-2', 'border border-neutral-700')}
                  onClick={markAllAsRead}
                  variant="text"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
          {(unreadCount > 0 || showAll) && (
            <div className={styles.TOGGLE_ROW}>
              <Button
                className={cn(styles.TOGGLE_BTN, !showAll && styles.TOGGLE_ACTIVE)}
                onClick={() => setShowAll(false)}
                size="sm"
                variant="text"
              >
                Unread
              </Button>
              <Button
                className={cn(styles.TOGGLE_BTN, showAll && styles.TOGGLE_ACTIVE)}
                onClick={() => setShowAll(true)}
                size="sm"
                variant="text"
              >
                All
              </Button>
            </div>
          )}
        </div>
        <div className={styles.LIST_CONTAINER}>
          {isLoading ? (
            <div className={styles.CENTER_PANE}>
              <p className={styles.LOADING_TEXT}>Loading notifications...</p>
            </div>
          ) : hasError ? (
            <div className={styles.CENTER_PANE}>
              <p className={styles.ERROR_TEXT}>Failed to load notifications</p>
              <p className={styles.ERROR_SUBTEXT}>Please try again</p>
            </div>
          ) : showCaughtUp ? (
            <div className={styles.CENTER_PANE}>
              <p className={styles.CAUGHT_UP_TEXT}>You&apos;re all caught up!</p>
              {/* <Button
                className="gap-2 rounded-none border"
                onClick={() => setShowAll(true)}
                variant="text"
              >
                Show all notifications
              </Button> */}
            </div>
          ) : filtered.length > 0 ? (
            (filtered as NotificationItem[]).map((n) => (
              <Row item={n} key={n.id} onRead={markAsRead} />
            ))
          ) : (
            <div className={styles.CENTER_PANE}>
              <p className={styles.LOADING_TEXT}>No notifications yet</p>
            </div>
          )}
        </div>
        <div className={styles.FOOTER_WRAPPER}>
          <Button className={styles.FOOTER_BTN} onClick={() => setShowAll(true)} size="sm" variant="text">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-xs">Show all</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
