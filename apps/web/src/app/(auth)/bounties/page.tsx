"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { LINKS } from "@/constants/links";
import { CreateBountyModal } from "@/components/bounty/create-bounty-modal";
import GithubImportModal from "@/components/bounty/github-import-modal";
import { useBountyModals } from "@/lib/bounty-utils";
import { useRouter } from "next/navigation";
import { authClient } from "@bounty/auth/client";
import { Spinner } from "@/components/ui/spinner";
import React from "react";

export default function BountiesPage() {
  const { data: session } = authClient.useSession();
  
  const { data: bounties, isLoading, error } = useQuery(
    trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 50
    })
  );

  const router = useRouter();

  const {
    createModalOpen,
    openCreateModal,
    closeCreateModal,
  } = useBountyModals();
  const [importOpen, setImportOpen] = React.useState(false);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Bounties</h1>
          <p className="text-gray-600">{error.message}</p>
          <Button
            onClick={() => router.refresh()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }



  return (
    <>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Available Bounties</h1>
            <div className="flex gap-2">
              <Button variant="outline" disabled={!session?.user} onClick={() => setImportOpen(true)}>Import from GitHub</Button>
              <Button disabled={!session?.user} onClick={() => openCreateModal()}>
                Create Bounty
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-screen">
              <Spinner />
            </div>
          ) : bounties?.data && bounties.data.length > 0 ? (
            <>
              <div className="mb-6 text-gray-600">
                Showing {bounties.data.length} of {bounties.pagination?.total || 0} bounties
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bounties.data.map((bounty) => (
                  <div key={bounty.id} className="border border-gray-200 rounded-md p-4 hover:shadow-lg transition-shadow">
                    <h2 className="text-lg font-bold mb-2">{bounty.title}</h2>
                    <p className="text-gray-600 mb-3 line-clamp-2">{bounty.description}</p>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(bounty.amount)} {bounty.currency}
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {bounty.difficulty}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Status: {bounty.status}</span>
                      <span>by {bounty.creator.name}</span>
                    </div>

                    <Link
                      href={`${LINKS.BOUNTY.VIEW}/${bounty.id}`}
                      className="inline-block mt-3 text-blue-600 hover:underline font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-600 mb-4">No bounties available</h2>
              <p className="text-gray-500 mb-6">Be the first to create a bounty!</p>
              <Button onClick={() => openCreateModal()}>
                Create First Bounty
              </Button>
            </div>
          )}
        </div>
        
        <CreateBountyModal
          open={createModalOpen}
          onOpenChange={closeCreateModal}
        />
        <GithubImportModal open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}