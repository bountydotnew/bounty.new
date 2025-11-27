"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface DashboardPreviewProps {
  entryId: string;
  email: string;
}

export function DashboardPreview({ entryId, email }: DashboardPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [entry, setEntry] = useState<any>(null);

  const { data, isLoading } = useQuery({
    ...trpc.earlyAccess.getWaitlistEntry.queryOptions({ entryId }),
  });

  useEffect(() => {
    if (data?.success && data.data) {
      setEntry(data.data);
    }
  }, [data]);

  const referralLink = entry
    ? `https://bounty.new?ref=${entry.id}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const bountyDraft = entry ? {
    title: entry.bountyTitle,
    description: entry.bountyDescription,
    price: entry.bountyAmount ? parseInt(entry.bountyAmount) : undefined,
  } : null;

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="mb-8">
        <h2 className="text-[32px] font-medium text-white mb-2">
          You're on the list!
        </h2>
        <p className="text-[#929292] text-base">
          Your bounty draft is saved. We'll notify you at{" "}
          <span className="text-white">{email}</span> when bounty.new launches.
        </p>
      </div>

      {/* Bounty card */}
      {bountyDraft && (
        <div className="rounded-xl bg-[#191919] border border-[#232323] overflow-hidden mb-6">
          <div className="p-5 border-b border-[#232323]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#929292] text-xs">
                  Draft
                </span>
                {bountyDraft.price && (
                  <span className="px-2 py-0.5 rounded-full bg-[#1E3A2F] text-[#4ADE80] text-xs">
                    ${(bountyDraft.price / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-white text-xl font-medium mb-2">
              {bountyDraft.title || "Your first bounty"}
            </h3>
            <p className="text-[#929292] text-sm">
              {bountyDraft.description ||
                "This bounty will be published when bounty.new launches. You'll be notified via email."}
            </p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#232323]" />
              <span className="text-[#929292] text-sm">You</span>
            </div>
            <button className="text-sm text-[#5A5A5A] hover:text-white transition-colors">
              Edit draft
            </button>
          </div>
        </div>
      )}

      {/* Stats preview */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#191919] border border-[#232323] p-4">
          <p className="text-[#5A5A5A] text-sm mb-1">Position</p>
          <p className="text-white text-2xl font-medium">#{entry.position}</p>
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
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 px-5 h-[36px] rounded-full text-white text-sm font-normal"
          style={{
            backgroundImage: "linear-gradient(180deg, #ccc 0%, #808080 100%)",
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy link"}
          {!copied && (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
