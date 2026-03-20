'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { Badge } from '@bounty/ui/components/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bounty/ui/components/tabs';
import {
  Eye,
  Flag,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  ExternalLink,
  User,
  Ban,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

type ModerationFlag = {
  id: string;
  contentType: 'bounty' | 'comment' | 'submission' | 'user';
  contentId: string;
  reason: string;
  flaggedText: string | null;
  reporterId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'auto_flagged';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  reportedUser?: {
    name: string | null;
    email: string;
    image: string | null;
    handle: string | null;
  } | null;
  reportedBounty?: {
    title: string;
    amount: string;
    status: string;
    creatorName: string | null;
    creatorHandle: string | null;
    creatorImage: string | null;
  } | null;
};

const contentTypeConfig = {
  bounty: {
    icon: FileText,
    label: 'Bounty',
  },
  comment: {
    icon: MessageSquare,
    label: 'Comment',
  },
  submission: {
    icon: FileText,
    label: 'Submission',
  },
  user: {
    icon: User,
    label: 'User',
  },
};

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'outline' as const,
  },
  approved: {
    label: 'Approved',
    variant: 'secondary' as const,
  },
  rejected: {
    label: 'Rejected',
    variant: 'secondary' as const,
  },
  auto_flagged: {
    label: 'Auto-flagged',
    variant: 'outline' as const,
  },
};

function ReportsSection() {
  const queryClient = useQueryClient();

  const { data: pendingReports, isLoading: loadingPending } = useQuery({
    ...trpc.moderation.getPendingFlags.queryOptions({ limit: 50, offset: 0 }),
    staleTime: 30_000,
  });

  const { data: allReports, isLoading: loadingAll } = useQuery({
    ...trpc.moderation.getFlags.queryOptions({ limit: 100, offset: 0 }),
    staleTime: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      flagId,
      status,
    }: {
      flagId: string;
      status: 'approved' | 'rejected';
    }) => trpcClient.moderation.reviewFlag.mutate({ flagId, status }),
    onSuccess: (_, { status }) => {
      toast.success(status === 'approved' ? 'Action taken' : 'Report dismissed');
      queryClient.invalidateQueries({
        queryKey: [['moderation']],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to review report');
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({
      flagId,
      userId,
    }: {
      flagId: string;
      userId: string;
    }) => {
      // Ban the user first
      await trpcClient.user.adminBanUser.mutate({
        userId,
        reason: 'Banned via moderation report',
      });
      // Then mark the flag as approved
      await trpcClient.moderation.reviewFlag.mutate({
        flagId,
        status: 'approved',
      });
    },
    onSuccess: () => {
      toast.success('User banned');
      queryClient.invalidateQueries({
        queryKey: [['moderation']],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to ban user');
    },
  });

  const pending = pendingReports ?? [];
  const all = allReports ?? [];
  const isLoading = loadingPending || loadingAll;

  const getContentLink = (flag: ModerationFlag) => {
    if (flag.contentType === 'bounty') {
      return `/bounty/${flag.contentId}`;
    }
    if (flag.contentType === 'user') {
      return `/profile/${flag.contentId}`;
    }
    // For comments and submissions, link to the bounty page
    // (would need to fetch the bountyId, but for now just return null)
    return null;
  };

  const renderUserReportCard = (flag: ModerationFlag, showActions = true) => {
    const statusCfg = statusConfig[flag.status];
    const reportedUser = flag.reportedUser;
    const displayName = reportedUser?.handle ?? reportedUser?.name ?? 'Unknown user';

    return (
      <div
        key={flag.id}
        className="flex items-center justify-between gap-4 px-4 py-4 border-b border-border-subtle last:border-b-0"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Reported user info */}
          <Link
            href={reportedUser?.handle ? `/@${reportedUser.handle}` : `/profile/${flag.contentId}`}
            className="flex items-center gap-3 min-w-0 hover:opacity-80"
          >
            <Avatar className="h-10 w-10 rounded-full shrink-0">
              {reportedUser?.image && (
                <AvatarImage alt={displayName} src={reportedUser.image} />
              )}
              <AvatarFacehash name={displayName} size={40} />
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </span>
                {flag.status !== 'pending' && (
                  <Badge variant={statusCfg.variant} className="text-xs">
                    {flag.status === 'approved' ? 'Banned' : 'Dismissed'}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-text-muted truncate block">
                {reportedUser?.email ?? flag.contentId}
              </span>
            </div>
          </Link>

          {/* Report details */}
          <div className="hidden sm:block h-8 w-px bg-border-subtle" />
          <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-text-muted">Reason</span>
            <span className="text-sm text-foreground truncate max-w-[200px]">
              {flag.reason}
            </span>
          </div>

          <div className="hidden md:block h-8 w-px bg-border-subtle" />
          <div className="hidden md:flex flex-col gap-0.5">
            <span className="text-xs text-text-muted">Reported</span>
            <span className="text-sm text-text-secondary">
              {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {showActions && flag.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                reviewMutation.mutate({ flagId: flag.id, status: 'rejected' })
              }
              disabled={reviewMutation.isPending || banUserMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5" />
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                banUserMutation.mutate({
                  flagId: flag.id,
                  userId: flag.contentId,
                })
              }
              disabled={reviewMutation.isPending || banUserMutation.isPending}
            >
              <Ban className="h-3.5 w-3.5" />
              Ban
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderBountyReportCard = (flag: ModerationFlag, showActions = true) => {
    const statusCfg = statusConfig[flag.status];
    const reportedBounty = flag.reportedBounty;
    const displayTitle = reportedBounty?.title ?? flag.flaggedText ?? 'Unknown bounty';
    const amount = reportedBounty?.amount ? `$${reportedBounty.amount}` : null;
    const creatorDisplay = reportedBounty?.creatorHandle ?? reportedBounty?.creatorName ?? 'Unknown';

    return (
      <div
        key={flag.id}
        className="flex items-center justify-between gap-4 px-4 py-4 border-b border-border-subtle last:border-b-0"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Bounty info */}
          <Link
            href={`/bounty/${flag.contentId}`}
            className="flex items-center gap-3 min-w-0 hover:opacity-80"
          >
            <Avatar className="h-10 w-10 rounded-lg shrink-0">
              {reportedBounty?.creatorImage && (
                <AvatarImage alt={creatorDisplay} src={reportedBounty.creatorImage} />
              )}
              <AvatarFacehash name={creatorDisplay} size={40} />
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {displayTitle}
                </span>
                {flag.status !== 'pending' && (
                  <Badge variant={statusCfg.variant} className="text-xs">
                    {flag.status === 'approved' ? 'Hidden' : 'Dismissed'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>by {creatorDisplay}</span>
                {amount && (
                  <>
                    <span>·</span>
                    <span className="text-green-600">{amount}</span>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* Report details */}
          <div className="hidden sm:block h-8 w-px bg-border-subtle" />
          <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-text-muted">Reason</span>
            <span className="text-sm text-foreground truncate max-w-[200px]">
              {flag.reason}
            </span>
          </div>

          <div className="hidden md:block h-8 w-px bg-border-subtle" />
          <div className="hidden md:flex flex-col gap-0.5">
            <span className="text-xs text-text-muted">Reported</span>
            <span className="text-sm text-text-secondary">
              {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {showActions && flag.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                reviewMutation.mutate({ flagId: flag.id, status: 'rejected' })
              }
              disabled={reviewMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() =>
                reviewMutation.mutate({ flagId: flag.id, status: 'approved' })
              }
              disabled={reviewMutation.isPending}
            >
              <EyeOff className="h-3.5 w-3.5" />
              Hide
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderGenericReportCard = (flag: ModerationFlag, showActions = true) => {
    const config = contentTypeConfig[flag.contentType];
    const Icon = config.icon;
    const statusCfg = statusConfig[flag.status];
    const contentLink = getContentLink(flag);

    return (
      <div
        key={flag.id}
        className="flex flex-col gap-3 px-4 py-4 border-b border-border-subtle last:border-b-0"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-surface-2 shrink-0 text-text-secondary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {config.label} reported
                </span>
                <Badge variant={statusCfg.variant} className="text-xs">
                  {statusCfg.label}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                {flag.reason}
              </p>
              {flag.flaggedText && (
                <p className="text-xs text-text-muted mt-1 line-clamp-2 bg-surface-2 rounded px-2 py-1">
                  "{flag.flaggedText}"
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>
                  {formatDistanceToNow(new Date(flag.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {contentLink && (
                  <Link
                    href={contentLink}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    View content
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {showActions && flag.status === 'pending' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  reviewMutation.mutate({ flagId: flag.id, status: 'rejected' })
                }
                disabled={reviewMutation.isPending}
              >
                <XCircle className="h-3.5 w-3.5" />
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  reviewMutation.mutate({ flagId: flag.id, status: 'approved' })
                }
                disabled={reviewMutation.isPending}
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReportCard = (flag: ModerationFlag, showActions = true) => {
    if (flag.contentType === 'user') {
      return renderUserReportCard(flag, showActions);
    }
    if (flag.contentType === 'bounty') {
      return renderBountyReportCard(flag, showActions);
    }
    return renderGenericReportCard(flag, showActions);
  };

  return (
    <div className="space-y-6">
      {/* Pending Reports */}
      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle flex items-center gap-2">
          <Flag className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-medium text-foreground">
            Pending Reports
          </span>
          {pending.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pending.length}
            </Badge>
          )}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            Loading...
          </div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            No pending reports
          </div>
        ) : (
          <div>{pending.map((flag) => renderReportCard(flag as ModerationFlag))}</div>
        )}
      </div>

      {/* All Reports */}
      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle">
          <span className="text-sm font-medium text-text-secondary">
            All Reports ({all.length})
          </span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            Loading...
          </div>
        ) : all.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            No reports yet.
          </div>
        ) : (
          <div>
            {all.map((flag) => renderReportCard(flag as ModerationFlag, false))}
          </div>
        )}
      </div>
    </div>
  );
}

function HiddenBountiesSection() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    ...trpc.bounties.getHiddenBounties.queryOptions(),
    staleTime: 30_000,
  });

  const unhideMutation = useMutation({
    mutationFn: (bountyId: string) =>
      trpcClient.bounties.hideBounty.mutate({ bountyId, hidden: false }),
    onSuccess: () => {
      toast.success('Bounty unhidden');
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getHiddenBounties']],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to unhide bounty');
    },
  });

  const bounties = data ?? [];

  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden">
      <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle">
        <span className="text-sm font-medium text-text-secondary">
          {bounties.length} hidden{' '}
          {bounties.length === 1 ? 'bounty' : 'bounties'}
        </span>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-tertiary">
          Loading...
        </div>
      ) : bounties.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-tertiary">
          No hidden bounties.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {bounties.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                  {b.creator.image && (
                    <AvatarImage
                      alt={b.creator.name ?? ''}
                      src={b.creator.image}
                    />
                  )}
                  <AvatarFacehash name={b.creator.name ?? 'User'} size={32} />
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/bounty/${b.id}`}
                    className="text-sm font-medium text-foreground truncate block hover:underline"
                  >
                    {b.title}
                  </Link>
                  <span className="text-xs text-text-muted">
                    by {b.creator.name ?? 'Unknown'} &middot; ${b.amount}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => unhideMutation.mutate(b.id)}
                disabled={unhideMutation.isPending}
              >
                <Eye className="h-3.5 w-3.5" />
                Unhide
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminModeration() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
        <p className="text-sm text-text-muted mt-1">
          Review reports and manage hidden content.
        </p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="hidden" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Hidden Bounties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>

        <TabsContent value="hidden">
          <HiddenBountiesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
