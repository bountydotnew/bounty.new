import { Share2, Bookmark, Check, Target, Edit, ArrowUpCircle, MessageCircle, Heart, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SubmissionCard from "@/components/bounty/submission-card";
import BountyActions from "@/components/bounty/bounty-actions";
import BountyComments from "@/components/bounty/bounty-comments";
import Composer from "../markdown/Composer";
import { Badge } from "../ui/badge";
import { SmartNavigation } from "@/components/ui/smart-breadcrumb";
import { EditBountyModal } from "@/components/bounty/edit-bounty-modal";
import { formatBountyAmount, useBountyModals } from "@/lib/bounty-utils";
import { formatLargeNumber } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useMemo, useState } from "react";
import { authClient } from "@bounty/auth/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import CommentEditDialog from "@/components/bounty/comment-edit-dialog";
import { SubmissionsMobileSidebar } from "@/components/bounty/submissions-mobile-sidebar";

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
}

export default function BountyDetailPage({
  id,
  title,
  description,
  amount,
  tags,
  user,
  rank,
  avatarSrc,
  canEditBounty,
}: BountyDetailPageProps) {
  const { editModalOpen, openEditModal, closeEditModal, editingBountyId } = useBountyModals();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const votes = useQuery(trpc.bounties.getBountyVotes.queryOptions({ bountyId: id }));
  const voteMutation = useMutation({
    ...trpc.bounties.voteBounty.mutationOptions(),
  });

  const handleUpvote = () => {
    const key = trpc.bounties.getBountyVotes.queryKey({ bountyId: id });
    const previous = queryClient.getQueryData<{ count: number; isVoted: boolean }>(key);
    const next = previous
      ? { count: previous.isVoted ? Math.max(0, Number(previous.count) - 1) : Number(previous.count) + 1, isVoted: !previous.isVoted }
      : { count: 1, isVoted: true };
    queryClient.setQueryData(key, next);
    voteMutation.mutate(
      { bountyId: id },
      {
        onError: () => {
          if (previous) queryClient.setQueryData(key, previous);
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      },
    );
  };
  const commentsQuery = useQuery(trpc.bounties.getBountyComments.queryOptions({ bountyId: id }));
  const [commentText, setCommentText] = useState("");
  const maxChars = 245;
  const remaining = maxChars - commentText.length;
  const addComment = useMutation({
    ...trpc.bounties.addBountyComment.mutationOptions(),
  });
  const [editState, setEditState] = useState<{ id: string; initial: string } | null>(null);

  const postComment = (content: string, parentId?: string) => {
    const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const optimistic: import("@/types/comments").BountyCommentCacheItem[] = [
      {
        id: `temp-${Date.now()}`,
        content,
        parentId: parentId ?? null,
        createdAt: new Date().toISOString(),
        user: session?.user ? { id: session.user.id, name: session.user.name || "You", image: session.user.image || null } : { id: "me", name: "You", image: null },
        likeCount: 0,
        isLiked: false,
        editCount: 0,
      },
      ...previous,
    ];
    queryClient.setQueryData(key, optimistic);
    addComment.mutate(
      { bountyId: id, content, parentId },
      {
        onError: () => {
          queryClient.setQueryData(key, previous);
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      },
    );
  };
  const toggleLike = useMutation({
    ...trpc.bounties.toggleCommentLike.mutationOptions(),
  });

  const likeComment = (commentId: string) => {
    const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const next = previous.map((c) =>
      c.id === commentId ? { ...c, likeCount: Number(c.likeCount || 0) + (c.isLiked ? -1 : 1), isLiked: !c.isLiked } : c,
    );
    queryClient.setQueryData(key, next);
    toggleLike.mutate(
      { commentId },
      {
        onError: () => {
          queryClient.setQueryData(key, previous);
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      },
    );
  };

  const updateComment = useMutation({ ...trpc.bounties.updateBountyComment.mutationOptions() });
  const deleteComment = useMutation({ ...trpc.bounties.deleteBountyComment.mutationOptions() });

  const onEditComment = (commentId: string, newContent: string) => {
    const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const next = previous.map((c) => (c.id === commentId ? { ...c, content: newContent, editCount: Number(c.editCount || 0) + 1 } : c));
    queryClient.setQueryData(key, next);
    updateComment.mutate(
      { commentId, content: newContent },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  const onDeleteComment = (commentId: string) => {
    const key = trpc.bounties.getBountyComments.queryKey({ bountyId: id });
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const next = previous.filter((c) => c.id !== commentId);
    queryClient.setQueryData(key, next);
    deleteComment.mutate(
      { commentId },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#111110] text-white p-6">
      <div className="max-w-[90%] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center justify-between gap-2 w-full">
            <SmartNavigation />
            <SubmissionsMobileSidebar inline />
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 xl:flex-[2]">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold leading-[120%] tracking-tight text-white">
                  {title}
                </h1>
                <span className="text-2xl font-semibold text-green-400">
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
              <div className="flex items-center justify-between w-full flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{user}</span>
                      <div className="w-4 h-4 bg-blue-500 rounded transform rotate-45 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white transform -rotate-45" />
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs">{rank}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full justify-end">
                  <BountyActions
                    bountyId={id}
                    canEdit={canEditBounty}
                    isVoted={Boolean(votes.data?.isVoted)}
                    voteCount={votes.data?.count ?? 0}
                    onUpvote={handleUpvote}
                    onEdit={() => openEditModal(id)}
                    onShare={() => {
                      navigator.share({
                        title: title,
                        text: description,
                        url: `${window.location.origin}/bounty/${id}`,
                      });
                    }}
                  />
                </div>
              </div>
              <CommentEditDialog
                open={Boolean(editState)}
                onOpenChange={(o) => {
                  if (!o) setEditState(null);
                }}
                initialValue={editState?.initial || ""}
                onSave={(val) => {
                  if (!editState) return;
                  onEditComment(editState.id, val);
                  setEditState(null);
                }}
                isSaving={updateComment.isPending}
              />
            </div>

            {/* About Section */}
            <div className="mb-8 p-6 rounded-lg bg-[#1D1D1D] border border-[#383838]/20">
              <h2 className="text-xl font-medium text-white mb-4">
                About
              </h2>
              <Composer>{description}</Composer>
            </div>
            <BountyComments bountyId={id} pageSize={5} />

          </div>

          <div className="hidden xl:block xl:w-[480px] xl:flex-shrink-0">
            <div className="sticky top-0 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Submissions</h3>
                <div className="hidden xl:flex items-center gap-2">
                  <Button className="items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-primary-foreground transition-colors">
                    Add submission
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <SubmissionCard
                  user="Fishy"
                  rank="Rank 5"
                  description="Here is my submission for the shadcn styling, in the ss you can se how the user can select the theme"
                  avatarSrc="/placeholder.svg?height=40&width=40"
                  hasBadge={true}
                  previewSrc="/placeholder.svg?height=80&width=80"
                  className="w-full"
                />

                <SubmissionCard
                  user="Sergio"
                  rank="Rank 2"
                  description="I one shotted this with v0"
                  avatarSrc="/placeholder.svg?height=40&width=40"
                  hasBadge={true}
                  previewSrc="/placeholder.svg?height=80&width=80"
                  className="w-full"
                />

                <SubmissionCard
                  user="Ahmet"
                  rank="New user"
                  description="There is my try"
                  avatarSrc="/placeholder.svg?height=40&width=40"
                  hasBadge={false}
                  previewSrc="/placeholder.svg?height=80&width=80"
                  className="w-full"
                />

                <div className="text-center text-gray-400 text-sm mt-6">
                  That&apos;s all for now...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditBountyModal
        open={editModalOpen}
        onOpenChange={closeEditModal}
        bountyId={editingBountyId}
      />
    </div>
  );
}
