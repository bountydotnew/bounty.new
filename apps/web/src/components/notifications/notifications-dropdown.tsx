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
import type {
  NotificationData,
  NotificationItem,
  NotificationRowProps,
} from '@/types/notifications';

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

  const icon = (() => {
    switch (item.type) {
      case 'bounty_comment':
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      case 'submission_received':
        return <FilePlus2 className="h-4 w-4 text-blue-400" />;
      case 'submission_approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'submission_rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'bounty_awarded':
        return <Award className="h-4 w-4 text-yellow-400" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-400" />;
    }
  })();

  return (
    <button
      className={cn(
        'w-full text-left',
        'rounded-md border border-neutral-800 bg-[#222222] p-3',
        'flex items-start gap-3',
        'transition-all duration-200 hover:bg-neutral-700/40 focus:outline-none'
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800/70">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'mb-0.5 text-sm',
                item.read ? 'text-neutral-300' : 'font-medium text-white'
              )}
            >
              {item.title}
            </div>
            <div className="truncate text-neutral-200 text-sm">
              {item.message}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="whitespace-nowrap text-neutral-500 text-xs">
              {displayTime}
            </span>
            {!item.read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
          </div>
        </div>
      </div>
    </button>
  );
}

export function NotificationsDropdown() {
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

  if (isLoading) {
    return null;
  }

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
        <div className="border-neutral-800 border-b px-3 pt-3 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-base text-white">
                Notifications
              </h3>
              <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">
                {unreadCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="h-7 rounded-md px-2 text-xs"
                onClick={refetch}
                variant="text"
              >
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  className="h-7 gap-2 rounded-md border border-neutral-700 px-2 text-xs"
                  onClick={markAllAsRead}
                  variant="text"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
          {(unreadCount > 0 || showAll) && (
            <div className="flex gap-1">
              <Button
                className={cn(
                  'rounded-md px-3 py-1',
                  !showAll && 'border border-neutral-700 bg-neutral-800/60'
                )}
                onClick={() => setShowAll(false)}
                size="sm"
                variant="text"
              >
                Unread
              </Button>
              <Button
                className={cn(
                  'rounded-md px-3 py-1',
                  showAll && 'border border-neutral-700 bg-neutral-800/60'
                )}
                onClick={() => setShowAll(true)}
                size="sm"
                variant="text"
              >
                All
              </Button>
            </div>
          )}
        </div>
        <div className="scrollbar-hide max-h-80 space-y-2 overflow-y-auto px-2 py-2">
          {hasError ? (
            <div className="px-3 py-6 text-center">
              <p className="mb-2 text-red-400 text-sm">
                Failed to load notifications
              </p>
              <p className="text-neutral-500 text-xs">Please try again</p>
            </div>
          ) : showCaughtUp ? (
            <div className="px-3 py-6 text-center">
              <p className="mb-3 text-neutral-300 text-sm">
                You&apos;re all caught up!
              </p>
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
            <div className="px-3 py-6 text-center">
              <p className="text-neutral-400 text-sm">No notifications yet</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end border-neutral-800 border-t px-3 py-2">
          <Button
            className="h-7 gap-1 rounded-md border border-neutral-700 px-2"
            onClick={() => setShowAll(true)}
            size="sm"
            variant="text"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-xs">Show all</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
