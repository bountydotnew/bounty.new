"use client";

import { formatCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { EditBountyModal } from "@/components/bounty/edit-bounty-modal";
import { useBountyModals, canEditBounty } from "@/lib/bounty-utils";
import { authClient } from "@bounty/auth/client";
import { Edit, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BountyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const bounty = useQuery(trpc.bounties.fetchBountyById.queryOptions({ id: resolvedParams.id }));
  
  const {
    editModalOpen,
    openEditModal,
    closeEditModal,
    editingBountyId,
  } = useBountyModals();
    
  if (bounty.isLoading) {
    return <div>Loading bounty...</div>;
  }
  
  if (bounty.error) {
    return <div>Error: {bounty.error.message}</div>;
  }
  
  if (!bounty.data?.data) {
    return <div>Bounty not found</div>;
  }
  
  const canEdit = session?.user?.id && bounty.data?.data ?
    canEditBounty(bounty.data.data, session.user.id) : false;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(resolvedParams.id)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Bounty
          </Button>
        )}
      </div>
      
      <h1 className="text-3xl font-bold mb-4">{bounty.data.data.title}</h1>
      <div className="space-y-4">
        <p className="text-lg">{bounty.data.data.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Amount</h3>
            <p>{formatCurrency(bounty.data.data.amount)} {bounty.data.data.currency}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
            <p className="capitalize">{bounty.data.data.status}</p>
          </div>
          <div>
            <h3 className="font-semibold">Difficulty</h3>
            <p className="capitalize">{bounty.data.data.difficulty}</p>
          </div>
          {bounty.data.data.deadline && (
            <div>
              <h3 className="font-semibold">Deadline</h3>
              <p>{new Date(bounty.data.data.deadline).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Requirements</h3>
          <p>{bounty.data.data.requirements}</p>
        </div>
        <div>
          <h3 className="font-semibold">Deliverables</h3>
          <p>{bounty.data.data.deliverables}</p>
        </div>
        {bounty.data.data.tags && bounty.data.data.tags.length > 0 && (
          <div>
            <h3 className="font-semibold">Tags</h3>
            <div className="flex gap-2 flex-wrap">
              {bounty.data.data.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-200 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <EditBountyModal
        open={editModalOpen}
        onOpenChange={closeEditModal}
        bountyId={editingBountyId}
      />
    </div>
  );
}