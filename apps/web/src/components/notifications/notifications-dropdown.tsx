'use client';

import { BellIcon } from '@bounty/ui/components/bell';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { cn } from '@bounty/ui/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
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
import { authClient } from '@bounty/auth/client';
import { useAccess } from '@/context/access-provider';

function Row({ item, onRead }: NotificationRowProps) {
  const router = useRouter();
  const ts =
    typeof item.createdAt === 'string'
      ? new Date(item.createdAt)
      : item.createdAt;
  const timeAgo = formatDistanceToNow(ts, { addSuffix: true });

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

  const iconColor = (() => {
    switch (item.type) {
      case 'bounty_comment':
        return '#0066FF';
      case 'submission_received':
        return '#00B894';
      case 'submission_approved':
        return '#6CFF0099';
      case 'submission_rejected':
        return '#E84393';
      case 'bounty_awarded':
        return '#E66700';
      default:
        return '#6C5CE7';
    }
  })();

  const Icon = (() => {
    switch (item.type) {
      case 'bounty_comment':
        return MessageSquare;
      case 'submission_received':
        return FilePlus2;
      case 'submission_approved':
        return CheckCircle2;
      case 'submission_rejected':
        return XCircle;
      case 'bounty_awarded':
        return Award;
      default:
        return Bell;
    }
  })();

  return (
    <button
      type="button"
      className={cn(
        'w-full text-left',
        'rounded-xl border border-[#232323] bg-[#191919] p-3',
        'flex items-start gap-[5px]',
        'transition duration-100 ease-out active:scale-[.98]',
        'focus:outline-none shadow-[0px_2px_3px_#00000033]',
        'min-w-0'
      )}
      onClick={handleClick}
    >
      <div
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] text-[8px] leading-[150%] text-white shadow-[inset_0px_2px_3px_#00000033]"
        style={{
          backgroundColor: iconColor,
          outline: `1px solid ${iconColor}`,
          outlineOffset: '-1px',
        }}
      >
        <Icon className="h-2.5 w-2.5" />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-[5px]">
        <div className="flex items-center justify-between min-w-0">
          <span
            className={cn(
              'text-[13px] leading-[150%] whitespace-normal break-words min-w-0',
              item.read ? 'font-normal text-[#FFFFFF99]' : 'font-medium text-white'
            )}
          >
            {item.title}
          </span>
          {!item.read && (
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6CFF0099] ml-[5px]" />
          )}
        </div>
        <div className="text-[11px] font-normal leading-[150%] text-[#FFFFFF99] line-clamp-1">
          {item.message}
        </div>
        <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
          <span className="text-[11px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
      </div>
    </button>
  );
}

// biome-ignore lint: UI component with conditional rendering
export function NotificationsDropdown({
  triggerClassName,
  children,
}: {
  triggerClassName?: string;
  children?: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();
  const { hasStageAccess } = useAccess();
  const enabled = Boolean(session) && hasStageAccess(['beta', 'production']);

  // Always call hooks before any conditional returns
  const {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications();
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () => (showAll ? notifications : notifications.filter((n) => !n.read)),
    [notifications, showAll]
  );
  const showCaughtUp =
    unreadCount === 0 && notifications.length > 0 && !showAll;

  // Don't show notifications dropdown if user doesn't have access
  if (!enabled) {
    return null;
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setShowAll(false)}>
      <DropdownMenuTrigger asChild>
        {children ? (
          <div className={cn('relative', triggerClassName)}>
            {children}
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-[#6CFF0099]" />
            )}
          </div>
        ) : (
          <Button
            className={cn(
              'relative rounded-lg border border-[#232323] bg-[#191919] p-2 text-[#CFCFCF] hover:bg-[#141414] transition-colors',
              triggerClassName
            )}
            size="sm"
            variant="text"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-[#6CFF0099]" />
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={-8}
        className="ml-2 w-[320px] rounded-xl border border-[#232323] bg-[#191919] p-0 shadow-[0px_2px_3px_#00000033] sm:ml-4"
        side="bottom"
        sideOffset={8}
      >
        <div className="border-[#232323] border-b px-3 pt-3 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-[5px]">
              <h3 className="text-[13px] font-medium leading-[150%] text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[13px] font-semibold leading-[150%] text-[#6CFF0099]">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="text-[11px] font-normal leading-[150%] text-[#FFFFFF99] hover:text-white transition-colors"
                onClick={markAllAsRead}
                type="button"
              >
                Mark all read
              </button>
            )}
          </div>
          {(unreadCount > 0 || showAll) && (
            <div className="flex gap-[5px]">
              <button
                className={cn(
                  'px-[3px] text-[11px] font-normal leading-[150%] transition-colors',
                  !showAll ? 'text-white' : 'text-[#FFFFFF99] hover:text-white'
                )}
                onClick={() => setShowAll(false)}
                type="button"
              >
                Unread
              </button>
              <span className="text-[#FFFFFF99]">·</span>
              <button
                className={cn(
                  'px-[3px] text-[11px] font-normal leading-[150%] transition-colors',
                  showAll ? 'text-white' : 'text-[#FFFFFF99] hover:text-white'
                )}
                onClick={() => setShowAll(true)}
                type="button"
              >
                All
              </button>
            </div>
          )}
        </div>
        <div className="scrollbar-hide max-h-[360px] space-y-2 overflow-y-auto px-3 py-3">
          {isLoading ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[13px] font-normal leading-[150%] text-[#FFFFFF99]">
                Loading notifications...
              </p>
            </div>
          ) : hasError ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[13px] font-normal leading-[150%] text-[#FFFFFF99]">
                Failed to load notifications
              </p>
            </div>
          ) : showCaughtUp ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[13px] font-normal leading-[150%] text-[#FFFFFF99]">
                You&apos;re all caught up!
              </p>
            </div>
          ) : filtered.length > 0 ? (
            (filtered as NotificationItem[]).map((n) => (
              <Row item={n} key={n.id} onRead={markAsRead} />
            ))
          ) : (
            <div className="px-3 py-8 text-center">
              <p className="text-[13px] font-normal leading-[150%] text-[#FFFFFF99]">
                No notifications yet
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
