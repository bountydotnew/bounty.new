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
import { Check } from 'lucide-react';
import { useState } from 'react';
import BountyActions from '@/components/bounty/bounty-actions';
import BountyComments from '@/components/bounty/bounty-comments';
import { BountyPaymentStepper } from '@/components/bounty/bounty-payment-stepper';
import CollapsibleText from '@/components/bounty/collapsible-text';
import CommentEditDialog from '@/components/bounty/comment-edit-dialog';
import { EditBountyModal } from '@/components/bounty/edit-bounty-modal';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import SubmissionCard from '@/components/bounty/submission-card';
import { SubmissionsMobileSidebar } from '@/components/bounty/submissions-mobile-sidebar';
import type { BountyCommentCacheItem } from '@/types/comments';
import { trpc } from '@/utils/trpc';

interface BountyDetailPageProps {
  id: string;
  title: string;
  amount: number;
  description: string;
  tags: string[];
  user: string;
  rank: string;
  avatarSrc: string;
  hasBadge: boolean;
  canEditBounty: boolean;
  initialVotes?: { count: number; isVoted: boolean };
  initialComments?: BountyCommentCacheItem[];
  initialBookmarked?: boolean;
  currency?: string;
}

export default function BountyDetailPage({
  id,
  title,
  description,
  amount,
  user,
  rank,
  avatarSrc,
  canEditBounty,
  initialVotes,
  initialComments,
  initialBookmarked,
  currency = 'USD',
}: BountyDetailPageProps) {
  const { editModalOpen, openEditModal, closeEditModal, editingBountyId } =
    useBountyModals();
  const queryClient = useQueryClient();
  const votes = useQuery({
    ...trpc.bounties.getBountyVotes.queryOptions({ bountyId: id }),
    initialData: initialVotes,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const voteMutation = useMutation({
    ...trpc.bounties.voteBounty.mutationOptions(),
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
      { bountyId: id },
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
  const [paymentStepperOpen, setPaymentStepperOpen] = useState(false);

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
    ...trpc.bounties.updateBountyComment.mutationOptions(),
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
      <div className="mx-auto max-w-[90%]">
        {/* Header */}
        <div className="mb-4 flex w-full items-center justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            <SmartNavigation />
            <SubmissionsMobileSidebar inline />
          </div>
        </div>

        <div className="flex flex-col gap-8 xl:flex-row">
          {/* Main Content */}
          <div className="flex-1 p-8 xl:flex-[2]">
            {/* Header */}
            <div className="mb-6">
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
                      <span className="font-medium text-sm text-white">
                        {user}
                      </span>
                      <div className="flex h-4 w-4 rotate-45 transform items-center justify-center rounded bg-blue-500">
                        <Check className="-rotate-45 h-2.5 w-2.5 transform text-white" />
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs">{rank}</span>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-2">
                  <BountyActions
                    bookmarked={initialBookmarked}
                    bountyId={id}
                    canEdit={canEditBounty}
                    isVoted={Boolean(votes.data?.isVoted)}
                    onEdit={() => openEditModal(id)}
                    onFundBounty={() => setPaymentStepperOpen(true)}
                    onShare={() => {
                      navigator.share({
                        title,
                        text: description,
                        url: `${window.location.origin}/bounty/${id}`,
                      });
                    }}
                    onUpvote={handleUpvote}
                    voteCount={votes.data?.count ?? 0}
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
            <BountyComments
              bountyId={id}
              initialComments={
                commentsQuery.data as BountyCommentCacheItem[] | undefined
              }
              pageSize={5}
            />
          </div>

          <div className="hidden xl:block xl:w-[480px] xl:flex-shrink-0">
            <div className="sticky top-0 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-medium text-lg text-white">Submissions</h3>
                <div className="hidden items-center gap-2 xl:flex">
                  <Button className="items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-primary-foreground transition-colors">
                    Add submission
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <SubmissionCard
                  avatarSrc="/placeholder.svg?height=40&width=40"
                  className="w-full"
                  description="Here is my submission for the shadcn styling, in the ss you can se how the user can select the theme"
                  hasBadge={true}
                  previewSrc="/placeholder.svg?height=80&width=80"
                  rank="Rank 5"
                  user="Fishy"
                />

                <SubmissionCard
                  avatarSrc="/placeholder.svg?height=40&width=40"
                  className="w-full"
                  description="I one shotted this with v0"
                  hasBadge={true}
                  previewSrc="/placeholder.svg?height=80&width=80"
                  rank="Rank 2"
                  user="Sergio"
                />

                <SubmissionCard
                  avatarSrc="/placeholder.svg?height=40&width=40"
                  className="w-full"
                  description="There is my try"
                  hasBadge={false}
                  previewSrc="/placeholder.svg?height=80&width=80"
                  rank="New user"
                  user="Ahmet"
                />

                <div className="mt-6 text-center text-gray-400 text-sm">
                  That&apos;s all for now...
                </div>
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

      <BountyPaymentStepper
        bountyAmount={amount}
        bountyId={id}
        bountyTitle={title}
        currency={currency}
        onOpenChange={setPaymentStepperOpen}
        open={paymentStepperOpen}
      />
    </div>
  );
}
