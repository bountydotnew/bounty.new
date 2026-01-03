'use client';

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

  // Auto-resize description
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(descriptionRef.current.scrollHeight, 100),
        600
      );
      descriptionRef.current.style.height = `${newHeight}px`;
    }
  }, []);

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
            toast.error('Validation error');
          }
        } else {
          toast.error(error.message || 'An error occurred');
        }
      } catch {
        // If parsing fails, show a generic error
        toast.error(error.message || 'An error occurred');
      }
    } else if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
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
        const cleanedPrice = price.replace(/,/g, '');
        await onSubmit({
          title: title || 'Untitled Bounty',
          description: description || '',
          amount: cleanedPrice || '0',
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
      const callbackUrl = encodeURIComponent('/waitlist/dashboard');
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
      const cleanedPrice = price.replace(/,/g, '');
      await saveBountyMutation.mutateAsync({
        entryId: effectiveEntryId,
        title: title || 'Untitled Bounty',
        description: description || '',
        amount: cleanedPrice || '0',
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
      const callbackUrl = encodeURIComponent('/waitlist/dashboard');
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    // If logged in, redirect to dashboard
    router.push('/waitlist/dashboard');
  };

  return (
    <div className="w-full max-w-[95vw] sm:max-w-[703px] mx-auto">
      <div className="w-full min-h-[140px] sm:min-h-[180px] rounded-[12px] sm:rounded-[21px] bg-[#191919] border border-[#232323] flex flex-col px-2 sm:px-0">
        {/* Top row: Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-1.5 sm:px-[14px] pt-2 sm:pt-3 pb-1.5 sm:pb-2 overflow-x-auto no-scrollbar">
          {/* Title chip */}
          <div
            className="rounded-[8px] sm:rounded-[14px] px-2 sm:px-[15px] py-1 sm:py-1.5 bg-[#1B1A1A] border border-[#232323] transition-colors h-[26px] sm:h-[31.9965px] flex items-center cursor-text shrink-0"
            onClick={() => titleRef.current?.focus()}
          >
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title"
              className="bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-[#5A5A5A] min-w-[80px] sm:min-w-[100px] max-w-[120px] sm:max-w-none"
              style={{
                width: `${calculateWidth(title || 'Enter a title', 80)}px`,
              }}
            />
          </div>

          {/* Price chip */}
          <div
            className="rounded-[8px] sm:rounded-[14px] px-2 sm:px-[15px] py-1 sm:py-1.5 bg-[#1B1A1A] border border-[#232323] transition-colors h-[26px] sm:h-[31.9965px] flex items-center cursor-text shrink-0"
            onClick={() => priceRef.current?.focus()}
          >
            <input
              ref={priceRef}
              type="text"
              value={price ? price.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
              onChange={(e) => {
                // Remove commas and non-numeric characters for storage
                const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                setPrice(cleaned);
              }}
              placeholder="Price"
              className="bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-[#5A5A5A] min-w-[50px] sm:min-w-[60px]"
              style={{
                width: `${calculateWidth(price ? price.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'Price', 50)}px`,
              }}
            />
          </div>

          {/* Deadline chip */}
          <div className="rounded-[8px] sm:rounded-[14px] px-2 sm:px-[15px] py-1 sm:py-1.5 bg-[#1B1A1A] border border-[#232323] transition-colors h-[26px] sm:h-[31.9965px] flex items-center gap-1.5 sm:gap-[5px] shrink-0 cursor-text min-w-[110px] sm:min-w-[140px]">
            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-[#5A5A5A]" />
            <DatePicker
              value={deadline}
              onChange={(value) => setDeadline(value)}
              placeholder="Deadline, e.g. tomorrow"
              className="flex-1 min-w-[80px] sm:min-w-[100px] text-sm sm:text-base [&>input]:pl-0.5 sm:[&>input]:pl-0"
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
        <div className="px-2 sm:px-[19px] py-1 sm:py-1.5 flex-1 flex">
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Start typing your description..."
            className="w-full bg-transparent text-[#5A5A5A] text-sm sm:text-base outline-none placeholder:text-[#5A5A5A] resize-none min-h-[80px] sm:min-h-[100px]"
          />
        </div>

        {/* Footer row with buttons */}
        <div className="flex justify-end items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-2 sm:py-3 flex-wrap">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-sm sm:text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              Cancel
            </button>
          )}
          {!(onSubmit || onCancel) && (
            <button
              onClick={handleSkipAndJoinWaitlist}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-[13px] h-[31.9965px] rounded-full bg-[#313030] text-white text-sm sm:text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              <span className="hidden sm:inline">
                {isSubmitting ? 'Redirecting...' : 'Skip & join waitlist'}
              </span>
              <span className="sm:hidden">
                {isSubmitting ? 'Redirecting...' : 'Skip'}
              </span>
            </button>
          )}
          <button
            onClick={handleCreateBounty}
            disabled={isSubmitting || !title}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-[13px] h-[31.9965px] rounded-full bg-white text-black text-sm sm:text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            <GitHub className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {isSubmitting
                ? onSubmit
                  ? 'Saving...'
                  : 'Creating...'
                : onSubmit
                  ? 'Save'
                  : 'Create bounty'}
            </span>
            <span className="sm:hidden">
              {isSubmitting
                ? onSubmit
                  ? 'Saving...'
                  : 'Creating...'
                : onSubmit
                  ? 'Save'
                  : 'Create'}
            </span>
          </button>
        </div>
      </div>
      <div className="text-[#5A5A5A] text-[10px] sm:text-sm text-center pt-2 sm:pt-3 px-2 sm:px-0">
        Creating a draft bounty is optional. This step is not required to sign
        up.
      </div>
    </div>
  );
}
