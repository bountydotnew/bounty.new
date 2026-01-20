"use client";

import { useState, useEffect, useRef } from 'react';
import { authClient } from '@bounty/auth/client';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { DatePicker } from '@bounty/ui/components/date-picker';
import { CalendarIcon } from '@bounty/ui/components/icons/huge/calendar';
import GitHub from '@/components/icons/github';
import { calculateWidth } from '@bounty/ui/lib/calculate-width';
import { ChevronDown } from 'lucide-react';
import { GithubIcon } from '@bounty/ui';

const BOUNTY_DRAFT_STORAGE_KEY = "bounty_draft";

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

export function BountyForm({
  initialValues,
  entryId,
  onSubmit,
  onCancel,
}: BountyFormProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(
    initialValues?.description || ''
  );
  const [price, setPrice] = useState(initialValues?.amount || '');
  const [deadline, setDeadline] = useState<string>(
    initialValues?.deadline || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Load draft from localStorage on mount (only if not in edit mode)
  useEffect(() => {
    if (initialValues) {
      return; // Skip if initial values provided
    }

    try {
      const stored = localStorage.getItem(BOUNTY_DRAFT_STORAGE_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as BountyDraft;
        if (draft.title) {
          setTitle(draft.title);
        }
        if (draft.description) {
          setDescription(draft.description);
        }
        if (draft.amount) {
          setPrice(draft.amount);
        }
        if (draft.deadline) {
          setDeadline(draft.deadline);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [initialValues]);

  // Save draft to localStorage whenever fields change (only if not in edit mode)
  useEffect(() => {
    if (onSubmit) {
      return; // Skip if in edit mode
    }

    const draft: BountyDraft = {
      title: title || undefined,
      description: description || undefined,
      amount: price || undefined,
      deadline: deadline || undefined,
    };
    localStorage.setItem(BOUNTY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [title, description, price, deadline, onSubmit]);

  const resizeDescription = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(Math.max(el.scrollHeight, 160), 600);
    el.style.height = `${newHeight}px`;
  };

  // Auto-resize description
  useEffect(() => {
    resizeDescription(descriptionRef.current);
  }, [description]);

  // Get waitlist entry ID when logged in
  const { data: myEntry } = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    enabled: !!session?.user && !entryId,
  });

  // Parse TRPC validation errors and show toast
  const parseAndShowErrors = (error: unknown) => {
    if (error instanceof TRPCClientError) {
      try {
        // TRPC validation errors come as JSON string in the message
        const parsed = JSON.parse(error.message);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Show the first error message
          const firstError = parsed[0];
          if (firstError.message) {
            toast.error(firstError.message);
          } else {
            toast.error("Validation error");
          }
        } else {
          toast.error(error.message || "An error occurred");
        }
      } catch {
        // If parsing fails, show a generic error
        toast.error(error.message || "An error occurred");
      }
    } else if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("An unexpected error occurred");
    }
  };

  const saveBountyMutation = useMutation({
    mutationFn: async (data: {
      entryId: string;
      title: string;
      description: string;
      amount: string;
      deadline?: string;
    }) => {
      // Remove commas from price before sending
      const cleanedAmount = data.amount.replace(/,/g, '');
      return await trpcClient.earlyAccess.updateBountyDraft.mutate({
        entryId: data.entryId,
        bountyTitle: data.title,
        bountyDescription: data.description,
        bountyAmount: cleanedAmount,
        bountyDeadline: data.deadline,
      });
    },
  });

  const handleCreateBounty = async () => {
    // If onSubmit is provided (edit mode), use it
    if (onSubmit && entryId) {
      setIsSubmitting(true);
      try {
        // Remove commas from price before submitting
        const cleanedPrice = price.replace(/,/g, "");
        await onSubmit({
          title,
          description: description || "",
          amount: cleanedPrice || "0",
          deadline: deadline || undefined,
        });
      } catch (error) {
        console.error('Failed to update bounty:', error);
        parseAndShowErrors(error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If logged out, save draft and redirect to login
    if (!session?.user) {
      const callbackUrl = encodeURIComponent("/waitlist/dashboard");
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    // If logged in, save bounty to waitlist entry
    const effectiveEntryId = entryId || myEntry?.id;
    if (!effectiveEntryId) {
      console.error('No waitlist entry found');
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove commas from price before submitting
      const cleanedPrice = price.replace(/,/g, "");
      await saveBountyMutation.mutateAsync({
        entryId: effectiveEntryId,
        title,
        description: description || "",
        amount: cleanedPrice || "0",
        deadline: deadline || undefined,
      });

      // Clear localStorage draft
      localStorage.removeItem(BOUNTY_DRAFT_STORAGE_KEY);

      // Redirect to dashboard
      router.push('/waitlist/dashboard');
    } catch (error) {
      console.error('Failed to save bounty:', error);
      parseAndShowErrors(error);
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
      const callbackUrl = encodeURIComponent("/waitlist/dashboard");
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    // If logged in, redirect to dashboard
    router.push("/waitlist/dashboard");
  };

  const formatWithCommas = (value: string) =>
    value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cleaned = e.target.value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    setPrice(cleaned);
  };

  const submitButtonLabel = isSubmitting
    ? onSubmit
      ? "Saving..."
      : "Creating..."
    : onSubmit
      ? "Save"
      : "Create bounty";

  const submitButtonLabelMobile = isSubmitting
    ? onSubmit
      ? "Saving..."
      : "Creating..."
    : onSubmit
      ? "Save"
      : "Create";

  return (
    <div className="w-full max-w-[95vw] sm:max-w-[805px] mx-auto">
      <div className="w-full rounded-[21px] bg-[#191919] border border-[#232323] flex flex-col p-4 gap-3">
        {/* Top row: Chips */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-row flex-wrap items-center gap-[5px]">
            {/* Title chip */}
            <div
              className="relative rounded-[7px] flex flex-row items-center px-1.5 py-[3px] bg-[#201F1F] gap-1 cursor-text"
              onClick={() => titleRef.current?.focus()}
            >
              {!title && !isTitleFocused && (
                <span
                  className="text-[#5A5A5A] text-[16px] leading-5 font-normal pointer-events-none absolute left-1.5"
                  aria-hidden="true"
                >
                  Title
                </span>
              )}
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                aria-label="Title"
                className="bg-transparent text-white text-[16px] leading-5 outline-none placeholder:text-[#5A5A5A]"
                style={{
                  width: `${calculateWidth(title || "Title", 50)}px`,
                }}
              />
            </div>

            {/* Price chip */}
            <div
              className="rounded-[7px] flex flex-row items-center px-1.5 py-[3px] bg-[#201F1F] gap-1 cursor-text"
              onClick={() => priceRef.current?.focus()}
            >
              <input
                ref={priceRef}
                type="text"
                value={price ? formatWithCommas(price) : ""}
                onChange={handlePriceChange}
                placeholder="Price"
                aria-label="Price"
                className="bg-transparent text-white text-[16px] leading-5 outline-none placeholder:text-[#5A5A5A]"
                style={{
                  width: `${calculateWidth(price ? formatWithCommas(price) : "Price", 40)}px`,
                }}
              />
            </div>

            {/* Deadline chip */}
            <div className="rounded-[7px] px-1.5 py-[3px] bg-[#201F1F] text-[#5A5A5A] text-[16px] leading-5 font-normal flex items-center gap-1 shrink-0">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <DatePicker
                value={deadline}
                onChange={(value) => setDeadline(value)}
                placeholder="Deadline, e.g. tomorrow"
                className="min-w-[140px]"
                id="deadline"
              />
            </div>
          </div>
        </div>

        {/* Description textarea */}
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            resizeDescription(e.target);
          }}
          placeholder="Start typing your description..."
          className="flex-1 min-h-[160px] bg-transparent text-white text-[16px] leading-6 outline-none resize-none placeholder:text-[#5A5A5A]"
        />

        {/* Footer row with repository selector and buttons */}
        <div className="flex flex-row justify-between items-center pt-2">
          {/* Mock Repository Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex flex-row items-center gap-2 text-[#5A5A5A] hover:text-[#888] transition-colors"
              disabled
            >
              <GithubIcon className="w-4 h-4" />
              <span className="text-[14px] leading-[150%] tracking-[-0.02em] font-medium">
                Select repositories
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
            )}
            {!(onSubmit || onCancel) && (
              <button
                onClick={handleSkipAndJoinWaitlist}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                <span className="hidden sm:inline">
                  {isSubmitting ? "Redirecting..." : "Skip & join waitlist"}
                </span>
                <span className="sm:hidden">
                  {isSubmitting ? "Redirecting..." : "Skip"}
                </span>
              </button>
            )}
            <button
              onClick={handleCreateBounty}
              disabled={isSubmitting || !title}
              className="flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full bg-white text-black text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              <GitHub className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{submitButtonLabel}</span>
              <span className="sm:hidden">{submitButtonLabelMobile}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="text-[#5A5A5A] text-[10px] sm:text-sm text-center pt-2 sm:pt-3 px-2 sm:px-0">
        Creating a draft bounty is optional. This step is not required to sign
        up.
      </div>
    </div>
  );
}
