'use client';

import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import { BountyDetailSkeleton } from '@/components/dashboard/skeletons/bounty-detail-skeleton';
import { trpc } from '@/utils/trpc';

export default function GithubIssueToBountyPage() {
  const params = useParams();
  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();

  const issueUrl = useMemo(() => {
    const owner = String(params?.owner || '');
    const repo = String(params?.repo || '');
    const issueNumber = String(params?.issueNumber || '');
    return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  }, [params]);

  const { data, isLoading, error } = useQuery(
    trpc.repository.issueFromUrl.queryOptions({ url: issueUrl })
  );
  useEffect(() => {
    if (!(isLoading || error) && data) {
      openCreateModal();
    }
  }, [isLoading, error, data, openCreateModal]);
  const initialValues = useMemo(() => {
    if (!data) {
      return;
    }
    let description = (data.data.body || '').slice(0, 1000);
    try {
      const cached = window.sessionStorage.getItem('bounty.importIssueBody');
      if (cached) {
        description = cached.slice(0, 1000);
      }
    } catch {
      description = (data.data.body || '').slice(0, 1000);
    }
    return {
      title: data.data.title || '',
      description,
      issueUrl: data.data.html_url,
      repositoryUrl: `https://github.com/${data.data.owner}/${data.data.repo}`,
      tags: Array.isArray(data.data.labels)
        ? data.data.labels
            .filter((label): label is string => label !== null)
            .slice(0, 5)
        : [],
      amount: data.data.detectedAmount || '',
      currency: data.data.detectedCurrency || 'USD',
    };
  }, [data]);

  useEffect(() => {
    return () => {
      try {
        window.sessionStorage.removeItem('bounty.importIssueBody');
      } catch {
        return;
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading && <BountyDetailSkeleton />}
      {error && (
        <div className="text-red-600">Invalid or inaccessible issue URL.</div>
      )}
      {data && <BountyDetailSkeleton />}

      <CreateBountyModal
        initialValues={initialValues}
        onOpenChange={(o) => (o ? openCreateModal() : closeCreateModal())}
        open={createModalOpen}
        redirectOnClose="/bounties"
        replaceOnSuccess
      />
    </div>
  );
}
