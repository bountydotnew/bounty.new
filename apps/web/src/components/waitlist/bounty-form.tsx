"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@bounty/auth/client";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";
import { DatePicker } from "@bounty/ui/components/date-picker";
import { CalendarIcon } from "@bounty/ui/components/icons/huge/calendar";
import GitHub from "@/components/icons/github";
import { calculateWidth } from "@bounty/ui/lib/calculateWidth";

const BOUNTY_DRAFT_STORAGE_KEY = 'bounty_draft';

interface BountyDraft {
  title?: string;
  description?: string;
  amount?: string;
  deadline?: string;
}

interface BountyFormProps {
  initialValues?: {
    title?: string;
    description?: string;
    amount?: string;
    deadline?: string;
  };
  entryId?: string;
  onSubmit?: (data: {
    title: string;
    description: string;
    amount: string;
    deadline?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function BountyForm({ initialValues, entryId, onSubmit, onCancel }: BountyFormProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [price, setPrice] = useState(initialValues?.amount || "");
  const [deadline, setDeadline] = useState<string>(initialValues?.deadline || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Load draft from localStorage on mount (only if not in edit mode)
  useEffect(() => {
    if (initialValues) return; // Skip if initial values provided
    
    try {
      const stored = localStorage.getItem(BOUNTY_DRAFT_STORAGE_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as BountyDraft;
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.amount) setPrice(draft.amount);
        if (draft.deadline) setDeadline(draft.deadline);
      }
    } catch {
      // Ignore parse errors
    }
  }, [initialValues]);

  // Save draft to localStorage whenever fields change (only if not in edit mode)
  useEffect(() => {
    if (onSubmit) return; // Skip if in edit mode
    
    const draft: BountyDraft = {
      title: title || undefined,
      description: description || undefined,
      amount: price || undefined,
      deadline: deadline || undefined,
    };
    localStorage.setItem(BOUNTY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [title, description, price, deadline, onSubmit]);

  // Auto-resize description
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(descriptionRef.current.scrollHeight, 160), 600);
      descriptionRef.current.style.height = `${newHeight}px`;
    }
  }, [description]);

  // Get waitlist entry ID when logged in
  const { data: myEntry } = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    enabled: !!session?.user && !entryId,
  });

  const saveBountyMutation = useMutation({
    mutationFn: async (data: {
      entryId: string;
      title: string;
      description: string;
      amount: string;
      deadline?: string;
    }) => {
      return await trpcClient.earlyAccess.updateBountyDraft.mutate({
        entryId: data.entryId,
        bountyTitle: data.title,
        bountyDescription: data.description,
        bountyAmount: data.amount,
      });
    },
  });

  const handleCreateBounty = async () => {
    // If onSubmit is provided (edit mode), use it
    if (onSubmit && entryId) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          title: title || "Untitled Bounty",
          description: description || "",
          amount: price || "0",
          deadline: deadline || undefined,
        });
      } catch (error) {
        console.error("Failed to update bounty:", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If logged out, save draft and redirect to login
    if (!session?.user) {
      const callbackUrl = encodeURIComponent('/waitlist/dashboard');
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    // If logged in, save bounty to waitlist entry
    const effectiveEntryId = entryId || myEntry?.id;
    if (!effectiveEntryId) {
      console.error("No waitlist entry found");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveBountyMutation.mutateAsync({
        entryId: effectiveEntryId,
        title: title || "Untitled Bounty",
        description: description || "",
        amount: price || "0",
        deadline: deadline || undefined,
      });
      
      // Clear localStorage draft
      localStorage.removeItem(BOUNTY_DRAFT_STORAGE_KEY);
      
      // Redirect to dashboard
      router.push('/waitlist/dashboard');
    } catch (error) {
      console.error("Failed to save bounty:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAndJoinWaitlist = () => {
    // If onSubmit is provided, we're in edit/create mode - don't show skip button
    if (onSubmit) {
      return;
    }

    if (!session?.user) {
      // Save draft and redirect to login
      const callbackUrl = encodeURIComponent('/waitlist/dashboard');
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    // If logged in, redirect to dashboard
    router.push('/waitlist/dashboard');
  };

  return (
    <div className="w-full max-w-[703px] min-h-[226px] rounded-[21px] bg-[#191919] border border-[#232323] flex flex-col">
      {/* Top row: Chips */}
      <div className="flex items-center gap-2.5 px-[14px] pt-3 pb-2 overflow-x-auto no-scrollbar">
        {/* Title chip */}
        <div 
          className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] transition-colors h-[31.9965px] flex items-center cursor-text"
          onClick={() => titleRef.current?.focus()}
        >
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            className="bg-transparent text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[100px]"
            style={{ width: `${calculateWidth(title || "Enter a title", 100)}px` }}
          />
        </div>

        {/* Price chip */}
        <div 
          className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] transition-colors h-[31.9965px] flex items-center cursor-text shrink-0"
          onClick={() => priceRef.current?.focus()}
        >
          <input
            ref={priceRef}
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="$ Price"
            className="bg-transparent text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[60px]"
            style={{ width: `${calculateWidth(price ? `$${price}` : "$ Price", 60)}px` }}
          />
        </div>

        {/* Deadline chip */}
        <div 
          className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] transition-colors h-[31.9965px] flex items-center gap-[5px] shrink-0 cursor-text min-w-[140px]"
        >
          <CalendarIcon className="w-4 h-4 shrink-0 text-[#5A5A5A]" />
          <DatePicker
            value={deadline}
            onChange={(value) => setDeadline(value)}
            placeholder="Tomorrow"
            className="flex-1 min-w-[100px]"
            id="deadline"
          />
        </div>

        {/* Divider */}
        {/* <span className="text-[#5A5A5A] text-base shrink-0">or</span> */}

        {/* GitHub import chip (placeholder) */}
        {/* <button 
          className="rounded-[14px] px-[15px] py-1.5 bg-[#313030] text-base text-[#828181] transition-colors flex items-center gap-[5px] shrink-0 h-[31.9965px] opacity-50 cursor-not-allowed"
          disabled
        >
          <GitHub className="w-4 h-4 shrink-0" />
          Import from GitHub
        </button> */}
      </div>

      {/* Description textarea */}
      <div className="px-[19px] py-2 flex-1 flex">
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Start typing your description..."
          className="w-full bg-transparent text-[#5A5A5A] text-base outline-none placeholder:text-[#5A5A5A] resize-none min-h-[160px]"
        />
      </div>

      {/* Footer row with buttons */}
      <div className="flex justify-end items-center gap-2 px-3 py-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        {!onSubmit && !onCancel && (
          <button
            onClick={handleSkipAndJoinWaitlist}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Redirecting..." : "Skip & join waitlist"}
          </button>
        )}
        <button
          onClick={handleCreateBounty}
          disabled={isSubmitting || !title}
          className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-white text-black text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <GitHub className="w-4 h-4 shrink-0" />
          {isSubmitting ? (onSubmit ? "Saving..." : "Creating...") : (onSubmit ? "Save" : "Create bounty")}
        </button>
      </div>
      <div className="text-[#5A5A5A] text-sm text-center pb-3">
        Creating a draft bounty is optional. This step is not required to sign up.
      </div>
    </div>
  );
}
