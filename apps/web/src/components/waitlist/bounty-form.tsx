"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@bounty/auth/client";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@bounty/ui/components/popover";
import { Calendar } from "lucide-react";
import GitHub from "@/components/icons/github";

interface BountyFormProps {
  onSubmitSuccess?: (email: string, entryId: string) => void;
}

const BOUNTY_DRAFT_STORAGE_KEY = 'bounty_draft';

interface BountyDraft {
  title?: string;
  description?: string;
  amount?: string;
  deadline?: string;
}

export function BountyForm({ onSubmitSuccess }: BountyFormProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Save draft to localStorage whenever fields change
  useEffect(() => {
    const draft: BountyDraft = {
      title: title || undefined,
      description: description || undefined,
      amount: price || undefined,
      deadline: deadline || undefined,
    };
    localStorage.setItem(BOUNTY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [title, description, price, deadline]);

  const convertToISOString = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";
    // datetime-local format is "YYYY-MM-DDTHH:mm"
    // Convert to ISO string by creating a Date object and converting to ISO
    // This handles timezone conversion properly
    const date = new Date(datetimeLocal);
    return date.toISOString();
  };

  const handleCreateBounty = async () => {
    // If not authenticated, redirect to login
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    // If authenticated, create the bounty
    setIsSubmitting(true);
    try {
      const result = await trpcClient.bounties.createBounty.mutate({
        title: title || "Untitled Bounty",
        description: description || "",
        amount: price || "0",
        currency: "USD",
        deadline: deadline ? convertToISOString(deadline) : undefined,
      });

      // Clear draft after successful creation
      localStorage.removeItem(BOUNTY_DRAFT_STORAGE_KEY);
      
      if (result?.data?.id) {
        router.push(`/dashboard`);
      }
    } catch (error) {
      console.error("Failed to create bounty:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAndJoinWaitlist = async () => {
    // This is the old flow - join waitlist without creating bounty
    // For now, we'll keep this as a placeholder
    if (onSubmitSuccess) {
      // You can implement waitlist-only flow here if needed
    }
  };

  const formatDeadline = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="w-full max-w-[703px] min-h-[226px] rounded-[21px] bg-[#191919] border border-[#232323] flex flex-col">
      {/* Top row: Chips */}
      <div className="flex items-center gap-2.5 px-[14px] pt-3 pb-2">
        {/* Title chip */}
        {activeField === "title" ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setActiveField(null)}
            placeholder="Enter a title"
            autoFocus
            className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[120px] h-[31.9965px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("title")}
            className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] text-base text-[#5A5A5A] transition-colors h-[31.9965px]"
          >
            {title || "Enter a title"}
          </button>
        )}

        {/* Price chip */}
        {activeField === "price" ? (
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            onBlur={() => !price && setActiveField(null)}
            placeholder="0"
            autoFocus
            className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] text-white text-base outline-none placeholder:text-[#5A5A5A] w-[80px] h-[31.9965px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("price")}
            className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] text-base text-[#5A5A5A] transition-colors h-[31.9965px] shrink-0"
          >
            {price ? `$${price}` : "$ Price"}
          </button>
        )}

        {/* Deadline chip */}
        <Popover open={showDeadlinePicker} onOpenChange={setShowDeadlinePicker}>
          <PopoverTrigger asChild>
            <button className="rounded-[14px] px-[15px] py-1.5 bg-[#1B1A1A] border border-[#232323] text-base text-[#5A5A5A] transition-colors flex items-center gap-[5px] shrink-0 h-[31.9965px]">
              <Calendar className="w-4 h-4 shrink-0" />
              {deadline ? formatDeadline(deadline) : "Create a deadline"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setShowDeadlinePicker(false);
              }}
              className="bg-transparent text-white p-4 outline-none"
              min={new Date().toISOString().slice(0, 16)}
            />
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <span className="text-[#5A5A5A] text-base shrink-0">or</span>

        {/* GitHub import chip (placeholder) */}
        <button 
          className="rounded-[14px] px-[15px] py-1.5 bg-[#313030] text-base text-[#828181] transition-colors flex items-center gap-[5px] shrink-0 h-[31.9965px]"
          disabled
        >
          <GitHub className="w-4 h-4 shrink-0" />
          Import from GitHub
        </button>
      </div>

      {/* Description textarea */}
      <div className="px-[19px] py-2 flex-1">
        {activeField === "description" ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setActiveField(null)}
            placeholder="Start typing your description..."
            autoFocus
            className="w-full bg-transparent text-[#5A5A5A] text-base outline-none placeholder:text-[#5A5A5A] resize-none min-h-[60px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("description")}
            className="w-full text-left text-[#5A5A5A] text-base transition-colors"
          >
            {description || "Start typing your description..."}
          </button>
        )}
      </div>

      {/* Footer row with buttons */}
      <div className="flex justify-end items-center gap-2 px-3 py-3">
        <button
          onClick={handleSkipAndJoinWaitlist}
          className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-base font-normal transition-opacity hover:opacity-90"
        >
          Skip & join waitlist
        </button>
        <button
          onClick={handleCreateBounty}
          disabled={isSubmitting || !title}
          className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-white text-black text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <GitHub className="w-4 h-4 shrink-0" />
          {isSubmitting ? "Creating..." : "Create bounty"}
        </button>
      </div>
    </div>
  );
}
