"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

interface BountyFormProps {
  onSubmitSuccess?: (email: string, entryId: string) => void;
}

export function BountyForm({ onSubmitSuccess }: BountyFormProps) {
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (input: {
      email: string;
      bountyTitle?: string;
      bountyDescription?: string;
      bountyAmount?: string;
    }) => {
      return await trpcClient.earlyAccess.submitWithBounty.mutate(input);
    },
  });

  const handleSubmit = async () => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      const result = await submitMutation.mutateAsync({
        email,
        bountyTitle: title || undefined,
        bountyDescription: description || undefined,
        bountyAmount: price || undefined,
      });

      if (result.success && result.entryId) {
        onSubmitSuccess?.(email, result.entryId);
      }
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-[21px] bg-[#191919] border border-[#232323] overflow-hidden">
      {/* Top row: Email input + hint */}
      <div className="flex items-center justify-between px-4 py-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email..."
          className="bg-transparent text-white text-base outline-none placeholder:text-[#5A5A5A] flex-1"
        />
        <span className="text-[#5A5A5A] text-base hidden sm:block">
          Create a bounty to join the waitlist
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#1E1E1E]" />

      {/* Chips row */}
      <div className="flex flex-row flex-wrap items-center gap-2.5 px-4 py-3">
        {/* Title chip */}
        {activeField === "title" ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setActiveField(null)}
            placeholder="Enter title..."
            autoFocus
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[120px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("title")}
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-base text-[#5A5A5A] hover:text-white transition-colors"
          >
            {title || "Title"}
          </button>
        )}

        {/* Description chip */}
        {activeField === "description" ? (
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => !description && setActiveField(null)}
            placeholder="Enter description..."
            autoFocus
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[150px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("description")}
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-base text-[#5A5A5A] hover:text-white transition-colors"
          >
            {description || "Description"}
          </button>
        )}

        {/* Price chip */}
        {activeField === "price" ? (
          <input
            type="text"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value.replace(/[^0-9.]/g, ""))
            }
            onBlur={() => !price && setActiveField(null)}
            placeholder="0"
            autoFocus
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-white text-base outline-none placeholder:text-[#5A5A5A] w-[80px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("price")}
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-base text-[#5A5A5A] hover:text-white transition-colors"
          >
            {price ? `$${price}` : "$ Price"}
          </button>
        )}

        {/* Divider text */}
        <span className="text-[#5A5A5A] text-base">or</span>

        {/* GitHub import chip */}
        <button className="rounded-full flex items-center gap-1.5 px-4 py-1.5 bg-[#201F1F] text-base text-[#5A5A5A] hover:text-white transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          Import from GitHub issue
        </button>
      </div>

      {/* Footer row with submit */}
      <div className="flex justify-end px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !email}
          className="flex items-center justify-center gap-1.5 px-[13px] h-[32px] rounded-full text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundImage: "linear-gradient(180deg, #ccc 0%, #808080 100%)",
          }}
        >
          {isSubmitting ? "Joining..." : "Join waitlist"}
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
