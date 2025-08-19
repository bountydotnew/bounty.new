"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { BountyDetailSkeleton } from "@/components/dashboard/skeletons/bounty-detail-skeleton";
import BountyDetailPage from "@/components/bounty/bounty-detail";

import { canEditBounty } from "@/lib/bounty-utils";
import { authClient } from "@bounty/auth/client";

export default function BountyPage({
  params,
}: {  
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const { data: session } = authClient.useSession();
  const bounty = useQuery(
    trpc.bounties.fetchBountyById.queryOptions({ id: resolvedParams.id }),
  );

  if (bounty.isLoading) {
    return <BountyDetailSkeleton />;
  }

  if (bounty.error) {
    return <div>Error: {bounty.error.message}</div>;
  }

  if (!bounty.data?.data) {
    return <div>Bounty not found</div>;
  }

  const canEdit = session?.user?.id && bounty.data?.data ? canEditBounty(bounty.data.data, session.user.id) : false;

  const detailTitle: string = bounty.data.data.title;
  const detailDescription: string = bounty.data.data.description;
  const detailTags: string[] = bounty.data.data.tags ?? [];
  const detailUser: string = bounty.data.data.creator.name ?? "";
  const detailAvatarSrc: string = bounty.data.data.creator.image ?? "";
  // const detailRank: string = bounty.data.data.difficulty;


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
    <>
    <BountyDetailPage
      id={resolvedParams.id}
      title={detailTitle}
      description={detailDescription}
      tags={detailTags}
      user={detailUser}
      rank={bounty.data.data.difficulty}
      avatarSrc={detailAvatarSrc}

      hasBadge={false}
      canEditBounty={canEdit}
    />
    </>
  );
}
