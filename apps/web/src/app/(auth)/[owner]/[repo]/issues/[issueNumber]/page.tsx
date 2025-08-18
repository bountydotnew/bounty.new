"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { CreateBountyModal } from "@/components/bounty/create-bounty-modal";
import { useBountyModals } from "@/lib/bounty-utils";
import { BountyDetailSkeleton } from "@/components/dashboard/skeletons/bounty-skeleton";

export default function GithubIssueToBountyPage() {
  const params = useParams();
  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();

  const issueUrl = useMemo(() => {
    const owner = String(params?.owner || "");
    const repo = String(params?.repo || "");
    const issueNumber = String(params?.issueNumber || "");
    return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  }, [params]);

  const { data, isLoading, error } = useQuery(
    trpc.repository.issueFromUrl.queryOptions({ url: issueUrl }),
  );
  useEffect(() => {
    if (!isLoading && !error && data) {
      openCreateModal();
    }
  }, [isLoading, error, data, openCreateModal]);
  const initialValues = useMemo(() => {
    if (!data) return undefined;
    return {
      title: data.title || "",
      description: (data.body || "").slice(0, 1000),
      issueUrl: data.html_url,
      repositoryUrl: `https://github.com/${data.owner}/${data.repo}`,
      tags: Array.isArray(data.labels) ? data.labels.slice(0, 5) : [],
      amount: data.detectedAmount || "",
      currency: data.detectedCurrency || "USD",
    };
  }, [data]);

  console.warn("html", data?.body_html);

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading && <BountyDetailSkeleton />}
      {error && (
        <div className="text-red-600">Invalid or inaccessible issue URL.</div>
      )}
      {data && <BountyDetailSkeleton />}

      <CreateBountyModal
        open={createModalOpen}
        onOpenChange={(o) => (o ? openCreateModal() : closeCreateModal())}
        initialValues={initialValues}
        redirectOnClose="/bounties"
        replaceOnSuccess
      />
    </div>
  );
}
