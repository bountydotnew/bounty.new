'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { canEditBounty } from '@bounty/ui/lib/bounty-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import BountyDetailPage from '@/components/bounty/bounty-detail';
import { BountyDetailSkeleton } from '@/components/dashboard/skeletons/bounty-detail-skeleton';
import Bounty from '@/components/icons/bounty';
import type { BountyCommentCacheItem } from '@/types/comments';
import { trpc, trpcClient } from '@/utils/trpc';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function BountyPage() {
  const { id } = useParams<{ id: string }>();
  const [payment] = useQueryState('payment', parseAsString);
  const [sessionId] = useQueryState('session_id', parseAsString);
  const isValidUuid = (v: string | undefined | null) =>
    typeof v === 'string' && UUID_REGEX.test(v);
  const validId = isValidUuid(id);

  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const bountyDetail = useQuery({
    ...trpc.bounties.getBountyDetail.queryOptions({ id: id ?? '' }),
    enabled: validId,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const router = useRouter();
  const hasVerifiedRef = useRef(false);

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (input: { sessionId: string }) => {
      return await trpcClient.bounties.verifyCheckoutPayment.mutate(input);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Payment verified! Your bounty is now live.');
        // Invalidate queries to refresh the page
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyDetail']],
        });
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyPaymentStatus']],
        });
      } else {
        toast.info(result.message || 'Payment is being processed. Please wait...');
      }
    },
    onError: (error: Error) => {
      console.error('Payment verification error:', error);
      toast.error(`Failed to verify payment: ${error.message}`);
    },
  });

  // Handle Stripe Checkout return - verify payment immediately
  useEffect(() => {
    if (payment === 'success' && sessionId && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      // Verify payment immediately
      verifyPaymentMutation.mutate({ sessionId });
      // Clean up URL immediately
      router.replace(`/bounty/${id}`);
    } else if (payment === 'cancelled') {
      toast.info('Payment was cancelled. You can complete payment later.');
      router.replace(`/bounty/${id}`);
    }
  }, [payment, sessionId, id, router, verifyPaymentMutation]);

  if (!validId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-lg px-6 py-5 text-center">
          <Bounty className="mx-auto mb-10 h-10 w-10" />
          <h1 className="font-semibold text-white text-xl">
            You got us scratching our heads... 😅
          </h1>
          <p className="mt-1 text-neutral-400 text-sm">
            Either you typed out the entire url and still got it wrong, someone
            is trolling you, or you arrived too late!
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Take me home
          </Button>
        </div>
      </div>
    );
  }

  if (bountyDetail.isLoading) {
    return <BountyDetailSkeleton />;
  }

  if (bountyDetail.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-lg px-6 py-5 text-center">
          <Bounty className="mx-auto mb-10 h-10 w-10" />
          <h1 className="font-semibold text-white text-xl">
            Couldn&apos;t load bounty
          </h1>
          <p className="mt-1 text-neutral-400 text-sm">
            Please try again in a moment.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Take me home
          </Button>
        </div>
      </div>
    );
  }

  if (!bountyDetail.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-lg px-6 py-5 text-center">
          <Bounty className="mx-auto mb-10 h-10 w-10" />
          <h1 className="font-semibold text-white text-xl">Bounty not found</h1>
          <p className="mt-1 text-neutral-400 text-sm">
            It may have been removed or never existed.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Take me home
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = session?.user?.id
    ? canEditBounty(bountyDetail.data.bounty, session.user.id)
    : false;
  const canDelete = session?.user?.id
    ? bountyDetail.data.bounty.createdById === session.user.id
    : false;

  const detailAmount: number = bountyDetail.data.bounty.amount;
  const detailTitle: string = bountyDetail.data.bounty.title;
  const detailDescription: string = bountyDetail.data.bounty.description;
  const detailTags: string[] = bountyDetail.data.bounty.tags ?? [];
  const detailUser: string = bountyDetail.data.bounty.creator.name ?? '';
  const detailAvatarSrc: string = bountyDetail.data.bounty.creator.image ?? '';
  const detailPaymentStatus: string | null = bountyDetail.data.bounty.paymentStatus ?? null;
  const detailCreatedById: string = bountyDetail.data.bounty.createdById;
  const detailGithubRepoOwner: string | null = bountyDetail.data.bounty.githubRepoOwner ?? null;
  const detailGithubRepoName: string | null = bountyDetail.data.bounty.githubRepoName ?? null;

  const initialComments = (bountyDetail.data.comments ?? []).map((comment: BountyCommentCacheItem) => ({
    ...comment,
    likeCount: typeof comment.likeCount === 'number' ? comment.likeCount : 0,
  })) as BountyCommentCacheItem[];

  return (
    // <div className="p-8 max-w-4xl mx-auto">
    //   <div className="flex items-center gap-4 mb-6">
    //     <Button
    //       variant="outline"
    //       size="sm"
    //       onClick={() => {
    //         const from = searchParams.get("from");
    //         if (from === "gh-issue") router.push("/bounties");
    //         else router.back();
    //       }}
    //     >
    //       <ArrowLeft className="w-4 h-4 mr-2" />
    //       Back
    //     </Button>
    //     {canEdit && (
    //       <Button variant="outline" size="sm" onClick={() => openEditModal(resolvedParams.id)}>
    //         <Edit className="w-4 h-4 mr-2" />
    //         Edit Bounty
    //       </Button>
    //     )}
    //   </div>

    //   <h1 className="text-3xl font-bold mb-4">{bounty.data.data.title}</h1>
    //   <div className="space-y-4">
    //     <Composer>{bounty.data.data.description}</Composer>
    //     <div className="grid grid-cols-2 gap-4">
    //       <div>
    //         <h3 className="font-semibold">Amount</h3>
    //         <p>
    //           {formatCurrency(bounty.data.data.amount)} {bounty.data.data.currency}
    //         </p>
    //       </div>
    //       <div>
    //         <h3 className="font-semibold">Status</h3>
    //         <p className="capitalize">{bounty.data.data.status}</p>
    //       </div>
    //       <div>
    //         <h3 className="font-semibold">Difficulty</h3>
    //         <p className="capitalize">{bounty.data.data.difficulty}</p>
    //       </div>
    //       {bounty.data.data.deadline && (
    //         <div>
    //           <h3 className="font-semibold">Deadline</h3>
    //           <p>{new Date(bounty.data.data.deadline).toLocaleDateString()}</p>
    //         </div>
    //       )}
    //     </div>

    //     {bounty.data.data.tags && bounty.data.data.tags.length > 0 && (
    //       <div>
    //         <h3 className="font-semibold">Tags</h3>
    //         <div className="flex gap-2 flex-wrap">
    //           {bounty.data.data.tags.map((tag: string) => (
    //             <span key={tag} className="px-2 py-1 bg-gray-200 rounded text-sm">
    //               {tag}
    //             </span>
    //           ))}
    //         </div>
    //       </div>
    //     )}
    //   </div>

    //   <EditBountyModal open={editModalOpen} onOpenChange={closeEditModal} bountyId={editingBountyId} />
    // </div>
    <BountyDetailPage
      amount={detailAmount}
      avatarSrc={detailAvatarSrc}
      canDeleteBounty={canDelete}
      canEditBounty={canEdit}
      description={detailDescription}
      hasBadge={false}
      id={id ?? ''}
      initialBookmarked={Boolean(bountyDetail.data.bookmarked)}
      initialComments={initialComments}
      initialVotes={bountyDetail.data.votes}
      paymentStatus={detailPaymentStatus}
      createdById={detailCreatedById}
      tags={detailTags}
      title={detailTitle}
      user={detailUser}
      githubRepoOwner={detailGithubRepoOwner}
      githubRepoName={detailGithubRepoName}
    />
  );
}
