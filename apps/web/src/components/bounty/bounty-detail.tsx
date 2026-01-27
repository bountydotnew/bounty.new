import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { SmartNavigation } from '@bounty/ui/components/smart-breadcrumb';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { formatLargeNumber } from '@bounty/ui/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { ActionItem } from '@/types/bounty-actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import BountyActions from '@/components/bounty/bounty-actions';
import BountyComments from '@/components/bounty/bounty-comments';
import CollapsibleText from '@/components/bounty/collapsible-text';
import CommentEditDialog from '@/components/bounty/comment-edit-dialog';
import { EditBountyModal } from '@/components/bounty/edit-bounty-modal';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import SubmissionCard from '@/components/bounty/submission-card';
import { SubmissionsMobileSidebar } from '@/components/bounty/submissions-mobile-sidebar';
import type { BountyCommentCacheItem } from '@/types/comments';
import { trpc, trpcClient } from '@/utils/trpc';
import { Header } from '../dual-sidebar/sidebar-header';
import { useSession } from '@/context/session-context';
import { Alert, AlertDescription } from '@bounty/ui/components/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Textarea } from '@bounty/ui/components/textarea';

interface BountyDetailPageProps {
  id: string;
  title: string;
  amount: number;
  description: string;
  tags: string[];
  user: string;
  avatarSrc: string;
  hasBadge: boolean;
  canEditBounty: boolean;
  canDeleteBounty?: boolean;
  initialVotes?: { count: number; isVoted: boolean };
  initialComments?: BountyCommentCacheItem[];
  initialBookmarked?: boolean;
  paymentStatus?: string | null;
  createdById?: string;
  // GitHub fields for PR links
  githubRepoOwner?: string | null;
  githubRepoName?: string | null;
  githubIssueNumber?: number | null;
  repositoryUrl?: string | null;
  issueUrl?: string | null;
}

export default function BountyDetailPage({
  id,
  title,
  description,
  amount,
  user,
  avatarSrc,
  canEditBounty,
  canDeleteBounty = false,
  initialVotes,
  initialComments,
  initialBookmarked,
  paymentStatus,
  createdById,
  githubRepoOwner,
  githubRepoName,
  githubIssueNumber,
  repositoryUrl,
  issueUrl,
}: BountyDetailPageProps) {
  const { editModalOpen, openEditModal, closeEditModal, editingBountyId } =
    useBountyModals();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useSession();

  // Fetch payment status if needed
  const paymentStatusQuery = useQuery({
    ...trpc.bounties.getBountyPaymentStatus.queryOptions({ bountyId: id }),
    enabled: Boolean(
      id &&
        session?.user?.id &&
        createdById &&
        createdById === session.user.id &&
        paymentStatus === 'pending'
    ),
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.createPaymentForBounty.mutate({
        bountyId: id,
        origin: window.location.origin,
      });
    },
    onSuccess: (result) => {
      if (result?.data?.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create payment: ${error.message}`);
    },
  });

  const handleCompletePayment = () => {
    createPaymentMutation.mutate();
  };

  const isCreator = session?.user?.id === createdById;
  const needsPayment = paymentStatus === 'pending' && isCreator;
  const isUnfunded = paymentStatus !== 'held' && paymentStatus !== null;

  const recheckPaymentMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.recheckPaymentStatus.mutate({
        bountyId: id,
      });
    },
    onSuccess: (result) => {
      if (result.success && result.paymentStatus === 'held') {
        toast.success(
          result.message || 'Payment verified! Bounty is now live.'
        );
        // Invalidate queries to refresh the page
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyDetail']],
        });
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyPaymentStatus']],
        });
      } else {
        toast.info(
          result.message || 'Payment status checked. No changes needed.'
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to recheck payment: ${error.message}`);
    },
  });

  const handleRecheckPayment = () => {
    recheckPaymentMutation.mutate();
  };

  const votes = useQuery({
    ...trpc.bounties.getBountyVotes.queryOptions({ bountyId: id }),
    initialData: initialVotes,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const voteMutation = useMutation({
    mutationFn: async (input: { bountyId: string; vote: boolean }) => {
      return await trpcClient.bounties.voteBounty.mutate(input);
    },
  });

  const handleUpvote = () => {
    const key = trpc.bounties.getBountyVotes.queryKey({ bountyId: id });
    const previous = votes.data;
    const next = previous
      ? {
          count: previous.isVoted
            ? Math.max(0, Number(previous.count) - 1)
            : Number(previous.count) + 1,
          isVoted: !previous.isVoted,
        }
      : { count: 1, isVoted: true };
    queryClient.setQueryData(key, next);
    voteMutation.mutate(
      { bountyId: id, vote: next.isVoted },
      {
        onError: () => {
          if (previous) {
            queryClient.setQueryData(key, previous);
          }
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      }
    );
  };
  const commentsQuery = useQuery({
    ...trpc.bounties.getBountyComments.queryOptions({ bountyId: id }),
    initialData: initialComments,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Fetch submissions for this bounty
  const submissionsQuery = useQuery({
    ...trpc.bounties.getBountySubmissions.queryOptions({ bountyId: id }),
    staleTime: 10_000, // Refetch every 10 seconds
  });
  // const [commentText] = useState('');
  // const maxChars = 245;
  // const remaining = maxChars - commentText.length;
  // const addComment = useMutation({
  //   ...trpc.bounties.addBountyComment.mutationOptions(),
  // });
  const [editState, setEditState] = useState<{
    id: string;
    initial: string;
  } | null>(null);

  const deleteBounty = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.bounties.deleteBounty.mutate(input);
    },
    onSuccess: () => {
      toast.success('Bounty deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['bounties'],
        type: 'all',
      });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete bounty: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this bounty? This action cannot be undone.'
      )
    ) {
      deleteBounty.mutate({ id });
    }
  };

  // Cancellation request logic for funded bounties
  // Include 'released' so completed bounties still show as funded
  const isFunded = paymentStatus === 'held' || paymentStatus === 'released';
  const isCancelled = paymentStatus === 'refunded';
  const canRequestCancellation = isCreator && isFunded;

  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Check if there's already a pending cancellation request
  const cancellationStatusQuery = useQuery({
    ...trpc.bounties.getCancellationStatus.queryOptions({ bountyId: id }),
    enabled: isCreator && isFunded,
  });

  const hasPendingCancellation =
    cancellationStatusQuery.data?.hasPendingRequest ?? false;

  // Owner can delete if:
  // 1. Bounty is not funded, OR
  // 2. Bounty has a pending cancellation request, OR
  // 3. Bounty is already cancelled/refunded
  const canDelete =
    isCreator && (!isFunded || hasPendingCancellation || isCancelled);

  const requestCancellationMutation = useMutation({
    mutationFn: async (input: { bountyId: string; reason?: string }) => {
      return await trpcClient.bounties.requestCancellation.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Cancellation request submitted');
      setShowCancellationDialog(false);
      setCancellationReason('');
      // Refresh cancellation status
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getCancellationStatus']],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to request cancellation: ${error.message}`);
    },
  });

  const cancelCancellationRequestMutation = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.cancelCancellationRequest.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Cancellation request withdrawn');
      // Refresh cancellation status
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getCancellationStatus']],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel cancellation request: ${error.message}`);
    },
  });

  const handleRequestCancellation = () => {
    if (hasPendingCancellation) {
      toast.error(
        'You already have a pending cancellation request for this bounty.'
      );
      return;
    }
    setShowCancellationDialog(true);
  };

  const handleConfirmCancellation = () => {
    if (!canRequestCancellation || requestCancellationMutation.isPending) {
      return;
    }
    requestCancellationMutation.mutate({
      bountyId: id,
      reason: cancellationReason || undefined,
    });
  };

  // const postComment = (content: string, parentId?: string) => {
  //   const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
  //   const previous: BountyCommentCacheItem[] =
  //     (commentsQuery.data as BountyCommentCacheItem[]) || [];
  //   const optimistic: BountyCommentCacheItem[] = [
  //     {
  //       id: `temp-${Date.now()}`,
  //       content,
  //       parentId: parentId ?? null,
  //       createdAt: new Date().toISOString(),
  //       user: session?.user
  //         ? {
  //             id: session.user.id,
  //             name: session.user.name || 'You',
  //             image: session.user.image || null,
  //           }
  //         : { id: 'me', name: 'You', image: null },
  //       likeCount: 0,
  //       isLiked: false,
  //       editCount: 0,
  //     },
  //     ...previous,
  //   ];
  //   queryClient.setQueryData(key, optimistic);
  //   addComment.mutate(
  //     { bountyId: id, content, parentId },
  //     {
  //       onError: () => {
  //         queryClient.setQueryData(key, previous);
  //       },
  //       onSettled: () => {
  //         queryClient.invalidateQueries({ queryKey: key });
  //       },
  //     }
  //   );
  // };
  // const toggleLike = useMutation({
  //   ...trpc.bounties.toggleCommentLike.mutationOptions(),
  // });

  // const likeComment = (commentId: string) => {
  //   const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
  //   const previous: BountyCommentCacheItem[] =
  //     (commentsQuery.data as BountyCommentCacheItem[]) || [];
  //   const next = previous.map((c) =>
  //     c.id === commentId
  //       ? {
  //           ...c,
  //           likeCount: Number(c.likeCount || 0) + (c.isLiked ? -1 : 1),
  //           isLiked: !c.isLiked,
  //         }
  //       : c
  //   );
  //   queryClient.setQueryData(key, next);
  //   toggleLike.mutate(
  //     { commentId },
  //     {
  //       onError: () => {
  //         queryClient.setQueryData(key, previous);
  //       },
  //       onSettled: () => {
  //         queryClient.invalidateQueries({ queryKey: key });
  //       },
  //     }
  //   );
  // };

  const updateComment = useMutation({
    mutationFn: async (input: { commentId: string; content: string }) => {
      return await trpcClient.bounties.updateBountyComment.mutate(input);
    },
  });
  // const deleteComment = useMutation({
  //   ...trpc.bounties.deleteBountyComment.mutationOptions(),
  // });

  const onEditComment = (commentId: string, newContent: string) => {
    const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
    const previous: BountyCommentCacheItem[] =
      (commentsQuery.data as BountyCommentCacheItem[]) || [];
    const next = previous.map((c) =>
      c.id === commentId
        ? { ...c, content: newContent, editCount: Number(c.editCount || 0) + 1 }
        : c
    );
    queryClient.setQueryData(key, next);
    updateComment.mutate(
      { commentId, content: newContent },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      }
    );
  };

  // const onDeleteComment = (commentId: string) => {
  //   const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
  //   const previous: BountyCommentCacheItem[] =
  //     (commentsQuery.data as BountyCommentCacheItem[]) || [];
  //   const next = previous.filter((c) => c.id !== commentId);
  //   queryClient.setQueryData(key, next);
  //   deleteComment.mutate(
  //     { commentId },
  //     {
  //       onError: () => queryClient.setQueryData(key, previous),
  //       onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  //     }
  //   );
  // };

  return (
    <div className="min-h-screen bg-[#111110] text-white">
      <Header />
      <div className="mx-auto max-w-[90%]">
        {/* Header */}
        <div className="mb-4 flex w-full items-center justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            <SmartNavigation />
            <SubmissionsMobileSidebar inline />
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Main Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              {needsPayment && (
                <Alert className="mb-4 border-yellow-500/20 bg-yellow-500/10">
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-yellow-400">
                      This bounty requires payment to become active. Complete
                      payment to allow submissions.
                    </span>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={handleRecheckPayment}
                        disabled={
                          recheckPaymentMutation.isPending ||
                          paymentStatusQuery.isLoading
                        }
                        size="sm"
                        variant="outline"
                      >
                        {recheckPaymentMutation.isPending
                          ? 'Syncing...'
                          : 'Sync'}
                      </Button>
                      <Button
                        onClick={handleCompletePayment}
                        disabled={
                          createPaymentMutation.isPending ||
                          paymentStatusQuery.isLoading
                        }
                        size="sm"
                      >
                        {createPaymentMutation.isPending
                          ? 'Preparing...'
                          : 'Complete Payment'}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {!isCreator && isUnfunded && (
                <Alert className="mb-4 border-[#232323] bg-[#191919]">
                  <AlertDescription className="text-[#FFFFFF99]">
                    This bounty is not yet funded. Submissions may be restricted
                    until payment is completed.
                  </AlertDescription>
                </Alert>
              )}
              <div className="mb-4 flex items-center justify-between">
                <h1 className="font-bold text-4xl text-white leading-[120%] tracking-tight">
                  {title}
                </h1>
                <span className="font-semibold text-2xl text-green-400">
                  ${formatLargeNumber(amount)}
                </span>
              </div>

              {/* <div className="flex items-center gap-4 mb-6">
                {tags.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-xs font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">New</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Development</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Design</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">OSS</span>
                    </div>
                  </>
                )}
              </div> */}

              {/* User Profile with Actions */}
              <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white whitespace-nowrap">
                        {user}
                      </span>
                      <div className="flex h-4 w-4 rotate-45 transform items-center justify-center rounded bg-blue-500">
                        <Check className="-rotate-45 h-2.5 w-2.5 transform text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-2">
                  <BountyActions
                    bookmarked={initialBookmarked}
                    bountyId={id}
                    canDelete={canDelete}
                    canEdit={canEditBounty}
                    isVoted={Boolean(votes.data?.isVoted)}
                    onDelete={canDelete ? handleDelete : undefined}
                    onEdit={() => openEditModal(id)}
                    onShare={() => {
                      navigator.share({
                        title,
                        text: description,
                        url: `${window.location.origin}/bounty/${id}`,
                      });
                    }}
                    onUpvote={handleUpvote}
                    repositoryUrl={repositoryUrl}
                    issueUrl={issueUrl}
                    voteCount={votes.data?.count ?? 0}
                    actions={
                      // Show cancellation options based on state
                      canRequestCancellation && !isCancelled
                        ? [
                            hasPendingCancellation
                              ? ({
                                  key: 'cancel-cancellation-request',
                                  label: 'Cancel cancellation request',
                                  onSelect: () =>
                                    cancelCancellationRequestMutation.mutate({
                                      bountyId: id,
                                    }),
                                  icon: <X className="h-3.5 w-3.5" />,
                                  disabled:
                                    cancelCancellationRequestMutation.isPending,
                                  className:
                                    'text-green-500 hover:bg-green-500/10 focus:bg-green-500/10',
                                } satisfies ActionItem)
                              : ({
                                  key: 'request-cancellation',
                                  label: 'Request cancellation',
                                  onSelect: handleRequestCancellation,
                                  icon: (
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  ),
                                  disabled: cancellationStatusQuery.isLoading,
                                  className:
                                    'text-yellow-500 hover:bg-yellow-500/10 focus:bg-yellow-500/10',
                                } satisfies ActionItem),
                          ]
                        : undefined
                    }
                  />
                </div>
              </div>
              <CommentEditDialog
                initialValue={editState?.initial || ''}
                isSaving={updateComment.isPending}
                onOpenChange={(o) => {
                  if (!o) {
                    setEditState(null);
                  }
                }}
                onSave={(val) => {
                  if (!editState) {
                    return;
                  }
                  onEditComment(editState.id, val);
                  setEditState(null);
                }}
                open={Boolean(editState)}
              />
            </div>

            {description && (
              <div className="mb-8 rounded-lg border border-[#383838]/20 bg-[#1D1D1D] p-6">
                <h2 className="mb-4 font-medium text-white text-xl">About</h2>
                <CollapsibleText>
                  <MarkdownContent content={description} />
                </CollapsibleText>
              </div>
            )}
            {/* Submissions */}
            <div className="mb-8 rounded-lg p-6">
              <h3 className="mb-4 font-medium text-lg text-white">
                Submissions
                {submissionsQuery.data?.submissions &&
                  submissionsQuery.data.submissions.length > 0 && (
                    <span className="ml-2 text-sm text-gray-400">
                      ({submissionsQuery.data.submissions.length})
                    </span>
                  )}
              </h3>

              <div className="space-y-4">
                {submissionsQuery.isLoading ? (
                  <div className="text-center text-gray-400 text-sm">
                    Loading submissions...
                  </div>
                ) : submissionsQuery.data?.submissions &&
                  submissionsQuery.data.submissions.length > 0 ? (
                  submissionsQuery.data.submissions.map((sub) => (
                    <SubmissionCard
                      key={sub.id}
                      className="w-full"
                      description={sub.description}
                      status={sub.status}
                      username={sub.githubUsername || undefined}
                      contributorName={sub.contributorName || undefined}
                      contributorImage={sub.contributorImage || undefined}
                      githubPullRequestNumber={sub.githubPullRequestNumber}
                      githubRepoOwner={githubRepoOwner || undefined}
                      githubRepoName={githubRepoName || undefined}
                      pullRequestUrl={sub.pullRequestUrl || undefined}
                      deliverableUrl={sub.deliverableUrl || undefined}
                    />
                  ))
                ) : (
                  <div className="rounded-lg p-6 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      No submissions yet
                    </p>
                    {githubRepoOwner && githubRepoName && githubIssueNumber && (
                      <a
                        href={`https://github.com/${githubRepoOwner}/${githubRepoName}/issues/${githubIssueNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2A2A28] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#383838]"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.08-.73.08-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        Submit on GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditBountyModal
        bountyId={editingBountyId}
        onOpenChange={closeEditModal}
        open={editModalOpen}
      />

      {/* Cancellation Request Dialog */}
      <Dialog
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
      >
        <DialogContent className="border border-[#232323] bg-[#191919] text-[#CFCFCF]">
          <DialogHeader>
            <DialogTitle className="text-white mb-2">
              Request Cancellation
            </DialogTitle>
            <DialogDescription className="text-[#A0A0A0]">
              Request to cancel this funded bounty. Our team will review your
              request and process a refund. Note: The platform fee is
              non-refundable.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px] border-[#333] bg-[#0a0a0a] text-white placeholder:text-[#666]"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCancellationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCancellation}
              disabled={requestCancellationMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {requestCancellationMutation.isPending
                ? 'Submitting...'
                : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
