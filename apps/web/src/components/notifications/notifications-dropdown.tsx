"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BellIcon } from "@/components/ui/bell";
import { Bell, MessageSquare, CheckCircle2, XCircle, FilePlus2, Award, ArrowUpRight } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  data: Record<string, unknown> | null;
};

function Row({ item, onRead }: { item: Item; onRead: (id: string) => void }) {
  const router = useRouter();
  const ts = typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt;
  const timeAgo = formatDistanceToNow(ts, { addSuffix: false });
  const displayTime = timeAgo.includes("less than") ? "now" : timeAgo;

  const handleClick = useCallback(() => {
    if (!item.read) onRead(item.id);
    const data = (item.data || {}) as Record<string, unknown>;
    if (item.type === "bounty_comment" && typeof data.bountyId === "string") {
      router.push(`/bounty/${data.bountyId}`);
      return;
    }
    if (item.type === "submission_received" && typeof data.bountyId === "string") {
      router.push(`/bounty/${data.bountyId}`);
      return;
    }
    if (item.type === "bounty_awarded" && typeof data.bountyId === "string") {
      router.push(`/bounty/${data.bountyId}`);
      return;
    }
  }, [item.id, item.read, item.type, item.data, onRead, router]);

  const icon = (() => {
    switch (item.type) {
      case "bounty_comment":
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      case "submission_received":
        return <FilePlus2 className="h-4 w-4 text-blue-400" />;
      case "submission_approved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "submission_rejected":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "bounty_awarded":
        return <Award className="h-4 w-4 text-yellow-400" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-400" />;
    }
  })();

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left",
        "rounded-md border border-neutral-800 bg-[#222222] p-3",
        "flex items-start gap-3",
        "transition-all duration-200 hover:bg-neutral-700/40 focus:outline-none"
      )}
    >
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800/70">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className={cn("mb-0.5 text-sm", !item.read ? "font-medium text-white" : "text-neutral-300")}>{item.title}</div>
            <div className="text-sm text-neutral-200 truncate">{item.message}</div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="text-xs text-neutral-500 whitespace-nowrap">{displayTime}</span>
            {!item.read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
          </div>
        </div>
      </div>
    </button>
  );
}

export function NotificationsDropdown() {
  const { notifications, unreadCount, isLoading, hasError, markAsRead, markAllAsRead } = useNotifications();
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => (showAll ? notifications : notifications.filter((n) => !n.read)), [notifications, showAll]);
  const showCaughtUp = unreadCount === 0 && notifications.length > 0 && !showAll;

  if (isLoading) return null;

  return (
    <DropdownMenu onOpenChange={(open) => !open && setShowAll(false)}>
      <DropdownMenuTrigger asChild>
        <Button variant="text" size="sm" className="relative rounded-none border-0 p-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white">
          <BellIcon />
          {unreadCount > 0 && <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-green-500" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-lg border border-neutral-800 bg-neutral-900 sm:w-96 p-0" side="bottom" align="end" sideOffset={4}>
        <div className="px-3 pb-2 pt-3 border-b border-neutral-800">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-white">Notifications</h3>
              <span className="text-[10px] text-neutral-400 rounded-md bg-neutral-800 px-2 py-0.5">{unreadCount}</span>
            </div>
            {unreadCount > 0 && (
              <Button variant="text" onClick={markAllAsRead} className="h-7 gap-2 rounded-md border border-neutral-700 px-2 text-xs">
                Mark all as read
              </Button>
            )}
          </div>
          {(unreadCount > 0 || showAll) && (
            <div className="flex gap-1">
              <Button variant="text" size="sm" onClick={() => setShowAll(false)} className={cn("rounded-md px-3 py-1", !showAll && "border border-neutral-700 bg-neutral-800/60")}>Unread</Button>
              <Button variant="text" size="sm" onClick={() => setShowAll(true)} className={cn("rounded-md px-3 py-1", showAll && "border border-neutral-700 bg-neutral-800/60")}>All</Button>
            </div>
          )}
        </div>
        <div className="scrollbar-hide max-h-80 overflow-y-auto px-2 py-2 space-y-2">
          {hasError ? (
            <div className="px-3 py-6 text-center">
              <p className="mb-2 text-sm text-red-400">Failed to load notifications</p>
              <p className="text-xs text-neutral-500">Please try again</p>
            </div>
          ) : showCaughtUp ? (
            <div className="px-3 py-6 text-center">
              <p className="mb-3 text-sm text-neutral-300">You're all caught up!</p>
              <Button variant="text" onClick={() => setShowAll(true)} className="gap-2 rounded-none border">Show all notifications</Button>
            </div>
          ) : filtered.length > 0 ? (
            (filtered as Item[]).map((n) => <Row key={n.id} item={n} onRead={markAsRead} />)
          ) : (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-neutral-400">No notifications yet</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800">
          <div className="text-xs text-neutral-400">View all</div>
          <Button variant="text" size="sm" onClick={() => setShowAll(true)} className="rounded-md px-2 h-7 gap-1 border border-neutral-700">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-xs">Open</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


