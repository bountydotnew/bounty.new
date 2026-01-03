'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { BountyForm } from './bounty-form';

const BOUNTY_DRAFT_STORAGE_KEY = 'bounty_draft';

interface DashboardPreviewProps {
  entryId: string;
  email: string;
}

export function DashboardPreview({ entryId, email }: DashboardPreviewProps) {
  const [entry, setEntry] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data, isLoading } = useQuery({
    ...trpc.earlyAccess.getWaitlistEntry.queryOptions({ entryId }),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      entryId: string;
      bountyTitle?: string;
      bountyDescription?: string;
      bountyAmount?: string;
      bountyDeadline?: string;
    }) => {
      return await trpcClient.earlyAccess.updateBountyDraft.mutate(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ['earlyAccess', 'getWaitlistEntry'],
          { input: { entryId }, type: 'query' },
        ],
      });
      setIsEditing(false);
    },
  });

  useEffect(() => {
    if (data?.success && data.data) {
      setEntry(data.data);
    }
  }, [data]);

  // Auto-save localStorage draft on mount if entry has no bounty
  useEffect(() => {
    if (
      hasAutoSaved ||
      isLoading ||
      !entry ||
      entry.bountyTitle ||
      entry.bountyDescription ||
      entry.bountyAmount
    ) {
      return;
    }

    const autoSaveDraft = async () => {
      try {
        const stored = localStorage.getItem(BOUNTY_DRAFT_STORAGE_KEY);
        if (stored) {
          const draft = JSON.parse(stored);
          if (draft.title || draft.description || draft.amount) {
            // Auto-save draft to database
            await updateMutation.mutateAsync({
              entryId,
              bountyTitle: draft.title,
              bountyDescription: draft.description,
              bountyAmount: draft.amount,
              bountyDeadline: draft.deadline,
            });

            // Clear localStorage
            localStorage.removeItem(BOUNTY_DRAFT_STORAGE_KEY);
            setHasAutoSaved(true);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    autoSaveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, isLoading, entryId, hasAutoSaved, updateMutation.mutateAsync]);

  if (isLoading || !entry) {
    return (
      <div className="w-full max-w-[800px] mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-[#191919] rounded mb-4 w-2/3" />
          <div className="h-4 bg-[#191919] rounded mb-8 w-1/2" />
        </div>
      </div>
    );
  }

  // Helper to format price with commas
  const formatPrice = (price: string | null | undefined): string => {
    if (!price) {
      return '';
    }
    const num = Number.parseFloat(price);
    if (Number.isNaN(num)) {
      return price;
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Helper to format deadline
  const formatDeadline = (
    deadline: string | Date | null | undefined
  ): string => {
    if (!deadline) {
      return '';
    }
    try {
      const date = typeof deadline === 'string' ? new Date(deadline) : deadline;
      if (Number.isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const bountyDraft = entry
    ? {
        title: entry.bountyTitle,
        description: entry.bountyDescription,
        price: entry.bountyAmount,
        deadline: entry.bountyDeadline,
      }
    : null;

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="mb-8">
        <h2 className="text-[32px] font-medium text-white mb-2">
          You're on the list!
        </h2>
        <p className="text-[#929292] text-base">
          Your bounty draft is saved. We'll notify you at{' '}
          <span className="text-white">{email}</span> when bounty.new launches.
        </p>
      </div>

      {/* Bounty card or edit form */}
      {isEditing ? (
        <div className="mb-6">
          <BountyForm
            initialValues={
              bountyDraft
                ? {
                    title: bountyDraft.title,
                    description: bountyDraft.description,
                    amount: bountyDraft.price || '',
                    deadline: bountyDraft.deadline
                      ? typeof bountyDraft.deadline === 'string'
                        ? bountyDraft.deadline
                        : bountyDraft.deadline.toISOString()
                      : '',
                  }
                : undefined
            }
            entryId={entryId}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({
                entryId,
                bountyTitle: data.title,
                bountyDescription: data.description,
                bountyAmount: data.amount,
                bountyDeadline: data.deadline,
              });
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : bountyDraft ? (
        <div className="rounded-xl bg-[#191919] border border-[#232323] overflow-hidden mb-6">
          <div className="p-5 border-b border-[#232323]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#929292] text-xs">
                  Draft
                </span>
                {bountyDraft.price && (
                  <span className="px-2 py-0.5 rounded-full bg-[#1E3A2F] text-[#4ADE80] text-xs">
                    ${formatPrice(bountyDraft.price)}
                  </span>
                )}
                {bountyDraft.deadline && (
                  <span className="px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#929292] text-xs">
                    Due: {formatDeadline(bountyDraft.deadline)}
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-white text-xl font-medium mb-2">
              {bountyDraft.title || 'Your first bounty'}
            </h3>
            <p className="text-[#929292] text-sm">
              {bountyDraft.description ||
                "This bounty will be published when bounty.new launches. You'll be notified via email."}
            </p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'You'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#232323] flex items-center justify-center">
                  <span className="text-[#929292] text-xs">
                    {(session?.user?.name || 'Y').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-[#929292] text-sm">You</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-[#5A5A5A] hover:text-white transition-colors"
            >
              Edit draft
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="mb-4 text-center">
            <h3 className="text-white text-xl font-medium mb-2">
              Create your bounty draft
            </h3>
            <p className="text-[#929292] text-sm">
              This is optional. You can skip and just join the waitlist.
            </p>
          </div>
          <BountyForm
            entryId={entryId}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({
                entryId,
                bountyTitle: data.title,
                bountyDescription: data.description,
                bountyAmount: data.amount,
                bountyDeadline: data.deadline,
              });
            }}
          />
        </div>
      )}

      {/* Stats preview */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#191919] border border-[#232323] p-4">
          <p className="text-[#5A5A5A] text-sm mb-1">Position</p>
          <p className="text-white text-2xl font-medium">
            {entry.position ? `#${entry.position}` : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-[#191919] border border-[#232323] p-4">
          <p className="text-[#5A5A5A] text-sm mb-1">Draft bounties</p>
          <p className="text-white text-2xl font-medium">
            {bountyDraft ? 1 : 0}
          </p>
        </div>
        <div className="rounded-xl bg-[#191919] border border-[#232323] p-4">
          <p className="text-[#5A5A5A] text-sm mb-1">Est. launch</p>
          <p className="text-white text-2xl font-medium">Q1 '25</p>
        </div>
      </div>

      {/* Share CTA */}
      <div className="mt-8 rounded-xl bg-[#191919] border border-[#232323] p-5 flex items-center justify-between">
        <div>
          <h4 className="text-white text-base font-medium mb-1">
            Skip the line
          </h4>
          <p className="text-[#929292] text-sm">
            Share your referral link to move up the waitlist
          </p>
        </div>
        <button
          disabled
          className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-white text-black text-base font-normal transition-opacity opacity-50 cursor-not-allowed"
        >
          Coming soon
        </button>
      </div>
    </div>
  );
}
