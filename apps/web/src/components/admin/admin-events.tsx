'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { formatDistanceToNow } from 'date-fns';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { Skeleton } from '@bounty/ui/components/skeleton';
import {
  UserPlus,
  Ban,
  Flag,
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  XCircle,
  Activity,
  MapPin,
  RefreshCw,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@bounty/ui/lib/utils';

type AdminEvent = {
  id: string;
  eventType: string;
  actorId: string | null;
  targetType: string | null;
  targetId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
    handle: string | null;
  } | null;
};

const eventConfig: Record<
  string,
  {
    icon: typeof UserPlus;
    color: string;
    label: string;
  }
> = {
  user_signup: {
    icon: UserPlus,
    color: 'text-green-500',
    label: 'User signed up',
  },
  user_banned: {
    icon: Ban,
    color: 'text-red-500',
    label: 'User banned',
  },
  user_unbanned: {
    icon: CheckCircle2,
    color: 'text-green-500',
    label: 'User unbanned',
  },
  early_access_granted: {
    icon: Gift,
    color: 'text-purple-500',
    label: 'Early access granted',
  },
  content_reported: {
    icon: Flag,
    color: 'text-orange-500',
    label: 'Content reported',
  },
  profanity_blocked: {
    icon: ShieldAlert,
    color: 'text-amber-500',
    label: 'Profanity blocked',
  },
  content_hidden: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Content hidden',
  },
  content_unhidden: {
    icon: CheckCircle2,
    color: 'text-green-500',
    label: 'Content unhidden',
  },
  ratelimit_hit: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    label: 'Rate limit hit',
  },
  bounty_created: {
    icon: DollarSign,
    color: 'text-blue-500',
    label: 'Bounty created',
  },
  bounty_funded: {
    icon: DollarSign,
    color: 'text-green-500',
    label: 'Bounty funded',
  },
  bounty_completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    label: 'Bounty completed',
  },
  bounty_cancelled: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Bounty cancelled',
  },
  admin_action: {
    icon: Activity,
    color: 'text-purple-500',
    label: 'Admin action',
  },
};

function EventIcon({ eventType }: { eventType: string }) {
  const config = eventConfig[eventType] ?? {
    icon: Activity,
    color: 'text-text-secondary',
    label: eventType,
  };
  const Icon = config.icon;

  return (
    <div className="flex size-5 items-center justify-center">
      <Icon className={cn('size-4', config.color)} />
    </div>
  );
}

function EventRow({ event }: { event: AdminEvent }) {
  const config = eventConfig[event.eventType] ?? {
    icon: Activity,
    color: 'text-text-secondary',
    label: event.eventType,
  };

  const timeAgo = formatDistanceToNow(new Date(event.createdAt), {
    addSuffix: false,
  });

  const geoString = [event.city, event.region, event.country]
    .filter(Boolean)
    .join(', ');

  // Build the target link if applicable
  let targetLink: string | null = null;
  if (event.targetType && event.targetId) {
    switch (event.targetType) {
      case 'bounty':
        targetLink = `/bounty/${event.targetId}`;
        break;
      case 'user':
        targetLink = `/admin/users?search=${event.targetId}`;
        break;
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Main event line */}
      <div className="flex items-center gap-1">
        <EventIcon eventType={event.eventType} />
        <div className="text-text-primary flex items-center gap-1.5 text-sm font-medium flex-wrap">
          <span>{event.description || config.label}</span>
          {event.actor && (
            <>
              <span className="text-text-secondary">by</span>
              <Link
                href={`/@${event.actor.handle || event.actor.id}`}
                className="flex items-center gap-1 hover:underline"
              >
                <Avatar className="size-4">
                  {event.actor.image ? (
                    <AvatarImage src={event.actor.image} />
                  ) : (
                    <AvatarFacehash name={event.actor.name ?? event.actor.handle ?? 'User'} size={16} />
                  )}
                </Avatar>
                <span>
                  {event.actor.handle
                    ? `@${event.actor.handle}`
                    : event.actor.name || 'Unknown'}
                </span>
              </Link>
            </>
          )}
          {targetLink && (
            <Link
              href={targetLink}
              className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-text-secondary hover:bg-surface-3"
            >
              View {event.targetType}
            </Link>
          )}
        </div>
      </div>

      {/* Metadata line */}
      <div className="flex items-center gap-1">
        <div className="flex size-5 items-center justify-center">
          <div className="bg-border-subtle h-5 w-px" />
        </div>
        <p className="text-text-tertiary text-sm font-medium flex items-center gap-2">
          <span>{timeAgo} ago</span>
          {geoString && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {geoString}
              </span>
            </>
          )}
          {event.ipAddress && event.ipAddress !== 'unknown' && (
            <>
              <span>·</span>
              <span className="font-mono text-xs">{event.ipAddress}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-1">
        <div className="flex size-5 items-center justify-center">
          <div className="bg-border-subtle h-5 w-px" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function AdminEvents() {
  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    ...trpc.adminEvents.getEvents.queryOptions({ limit: 50 }),
    staleTime: 30_000,
  });

  const events = (data?.events ?? []) as AdminEvent[];
  const total = data?.total ?? 0;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      {/* Header */}
      <div className="mt-5 mb-8 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Events</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('size-4 mr-1.5', isFetching && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
        <p className="text-text-secondary text-base">
          Recent activity and system events
          {total > 0 && (
            <span className="text-text-tertiary"> · {total} total</span>
          )}
        </p>
      </div>

      {/* Events list */}
      <div className="bg-surface-1 border border-border-subtle flex flex-col gap-4 rounded-xl p-4">
        {isLoading ? (
          <>
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
          </>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-text-secondary">
            No events yet
          </div>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>

      {/* Load more button */}
      {events.length > 0 && events.length < total && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
