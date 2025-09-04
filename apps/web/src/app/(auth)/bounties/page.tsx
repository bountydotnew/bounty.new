"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreateBountyModal } from "@/components/bounty/create-bounty-modal";
import GithubImportModal from "@/components/bounty/github-import-modal";
import { useBountyModals } from "@/lib/bounty-utils";
import { useRouter } from "next/navigation";
import { authClient } from "@bounty/auth/client";

import React from "react";
import { BountiesFeed } from "@/components/bounty/bounties-feed";
import { Header } from "@/components/dual-sidebar/sidebar-header";
import { Github, GithubIcon } from "lucide-react";
import GitHub from "@/components/icons/github";
import { FloatingCreateMenu } from "@/components/bounty/floating-create-menu";

export default function BountiesPage() {
  const { data: session } = authClient.useSession();

  const {
    data: bounties,
    isLoading,
    error,
  } = useQuery(
    trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 50,
    }),
  );

  const router = useRouter();

  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();
  const [importOpen, setImportOpen] = React.useState(false);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Bounties
          </h1>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => router.refresh()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">

        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!session?.user}
              onClick={() => setImportOpen(true)}
            >
              <GitHub className="h-4 w-4 fill-white" />
              Import from GitHub
            </Button>
            <Button disabled={!session?.user} onClick={() => openCreateModal()}>
              Create Bounty
            </Button>
          </div>
        </div>

        <BountiesFeed
          title=""
          layout="grid"
          bounties={bounties?.data}
          isLoading={isLoading}
          isError={error !== null}
          error={error}
        />
      </div>

      <CreateBountyModal
        open={createModalOpen}
        onOpenChange={closeCreateModal}
      />
      <GithubImportModal open={importOpen} onOpenChange={setImportOpen} />
      {/* <FloatingCreateMenu
        disabled={!session?.user}
        onCreate={() => openCreateModal()}
        onImport={() => setImportOpen(true)}
      /> */}
    </>
  );
}
