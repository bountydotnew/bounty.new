'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/context/session-context';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';
import GitHub from '@/components/icons/github';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bounty/ui/components/popover';
import { DeadlineChip } from '@/components/dashboard/task-form/components/DeadlineChip';

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

interface FormFields {
  title: string;
  description: string;
  price: string;
  deadline: string;
}

function useBountyFormState({
  initialValues,
  entryId,
  onSubmit,
}: Pick<BountyFormProps, 'initialValues' | 'entryId' | 'onSubmit'>) {
  const router = useRouter();
  const { session } = useSession();
  const [formFields, setFormFields] = useState<FormFields>({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    price: initialValues?.amount || '',
    deadline: initialValues?.deadline || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [titlePopoverOpen, setTitlePopoverOpen] = useState(false);
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);

  useEffect(() => {
    if (initialValues) {
      return;
    }

    try {
      const stored = localStorage.getItem(BOUNTY_DRAFT_STORAGE_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as BountyDraft;
        setFormFields({
          title: draft.title || '',
          description: draft.description || '',
          price: draft.amount || '',
          deadline: draft.deadline || '',
        });
      }
    } catch {
      // Ignore parse errors
    }
  }, [initialValues]);

  useEffect(() => {
    if (onSubmit) {
      return;
    }

    const draft: BountyDraft = {
      title: formFields.title || undefined,
      description: formFields.description || undefined,
      amount: formFields.price || undefined,
      deadline: formFields.deadline || undefined,
    };
    localStorage.setItem(BOUNTY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    formFields.title,
    formFields.description,
    formFields.price,
    formFields.deadline,
    onSubmit,
  ]);

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

  const { data: myEntry } = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    enabled: !!session?.user && !entryId,
  });

  const parseAndShowErrors = (error: unknown) => {
    if (error instanceof TRPCClientError) {
      try {
        const parsed = JSON.parse(error.message);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
    if (onSubmit && entryId) {
      setIsSubmitting(true);
      try {
        const cleanedPrice = formFields.price.replace(/,/g, '');
        await onSubmit({
          title: formFields.title || 'Untitled Bounty',
          description: formFields.description || '',
          amount: cleanedPrice || '0',
          deadline: formFields.deadline || undefined,
        });
      } catch (error) {
        console.error('Failed to update bounty:', error);
        parseAndShowErrors(error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!session?.user) {
      const callbackUrl = encodeURIComponent('/waitlist/dashboard');
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    const effectiveEntryId = entryId || myEntry?.id;
    if (!effectiveEntryId) {
      console.error('No waitlist entry found');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedPrice = formFields.price.replace(/,/g, '');
      await saveBountyMutation.mutateAsync({
        entryId: effectiveEntryId,
        title: formFields.title || 'Untitled Bounty',
        description: formFields.description || '',
        amount: cleanedPrice || '0',
        deadline: formFields.deadline || undefined,
      });

      localStorage.removeItem(BOUNTY_DRAFT_STORAGE_KEY);

      router.push('/waitlist/dashboard');
    } catch (error) {
      console.error('Failed to save bounty:', error);
      parseAndShowErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAndJoinWaitlist = () => {
    if (onSubmit) {
      return;
    }

    if (!session?.user) {
      const callbackUrl = encodeURIComponent('/waitlist/dashboard');
      router.push(`/login?callback=${callbackUrl}`);
      return;
    }

    router.push('/waitlist/dashboard');
  };

  return {
    formFields,
    setFormFields,
    isSubmitting,
    titleRef,
    priceRef,
    descriptionRef,
    titlePopoverOpen,
    setTitlePopoverOpen,
    pricePopoverOpen,
    setPricePopoverOpen,
    handleCreateBounty,
    handleSkipAndJoinWaitlist,
  };
}

function BountyFormChips({
  formFields,
  setFormFields,
  titleRef,
  priceRef,
  titlePopoverOpen,
  setTitlePopoverOpen,
  pricePopoverOpen,
  setPricePopoverOpen,
}: {
  formFields: FormFields;
  setFormFields: React.Dispatch<React.SetStateAction<FormFields>>;
  titleRef: React.RefObject<HTMLInputElement | null>;
  priceRef: React.RefObject<HTMLInputElement | null>;
  titlePopoverOpen: boolean;
  setTitlePopoverOpen: (open: boolean) => void;
  pricePopoverOpen: boolean;
  setPricePopoverOpen: (open: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 px-1.5 sm:px-[14px] pt-2 sm:pt-3 pb-1.5 sm:pb-2 overflow-x-auto no-scrollbar">
      <Popover open={titlePopoverOpen} onOpenChange={setTitlePopoverOpen}>
        <PopoverTrigger asChild>
          <div className="rounded-full flex justify-center items-center px-[11px] py-[6px] shrink-0 gap-2 bg-surface-2 border border-solid border-border-subtle hover:border-border-default transition-colors cursor-pointer">
            <span
              className={`text-[16px] leading-5 font-sans ${formFields.title ? 'text-foreground' : 'text-text-muted'}`}
            >
              {formFields.title || 'Title'}
            </span>
            <ChevronSortIcon className="size-2 text-text-muted shrink-0" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-3 bg-surface-1 border-border-subtle rounded-xl"
          align="start"
          sideOffset={8}
        >
          <input
            ref={titleRef}
            type="text"
            value={formFields.title}
            onChange={(e) =>
              setFormFields((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter a title"
            className="w-full bg-transparent text-foreground text-[16px] leading-5 outline-none placeholder:text-text-tertiary"
          />
        </PopoverContent>
      </Popover>

      <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
        <PopoverTrigger asChild>
          <div className="rounded-full flex justify-center items-center px-[11px] py-[6px] shrink-0 gap-2 bg-surface-2 border border-solid border-border-subtle hover:border-border-default transition-colors cursor-pointer">
            <span
              className={`text-[16px] leading-5 font-sans ${formFields.price ? 'text-foreground' : 'text-text-muted'}`}
            >
              {formFields.price
                ? formFields.price.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                : 'Price'}
            </span>
            <ChevronSortIcon className="size-2 text-text-muted shrink-0" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-3 bg-surface-1 border-border-subtle rounded-xl"
          align="start"
          sideOffset={8}
        >
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary text-[16px]">$</span>
            <input
              ref={priceRef}
              type="text"
              value={formFields.price}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                setFormFields((prev) => ({ ...prev, price: cleaned }));
              }}
              placeholder="0.00"
              className="flex-1 bg-transparent text-foreground text-[16px] leading-5 outline-none placeholder:text-text-tertiary"
            />
          </div>
        </PopoverContent>
      </Popover>

      <DeadlineChip
        value={formFields.deadline}
        onChange={(v) => setFormFields((prev) => ({ ...prev, deadline: v }))}
      />
    </div>
  );
}

function BountyFormFooter({
  onCancel,
  onSubmit,
  isSubmitting,
  formFields,
  handleSkipAndJoinWaitlist,
  handleCreateBounty,
}: {
  onCancel?: () => void;
  onSubmit?: BountyFormProps['onSubmit'];
  isSubmitting: boolean;
  formFields: FormFields;
  handleSkipAndJoinWaitlist: () => void;
  handleCreateBounty: () => void;
}) {
  return (
    <div className="flex justify-end items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-2 sm:py-3 flex-wrap">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-1.5 px-3 sm:px-[13px] h-[31.9965px] rounded-full bg-surface-3 text-foreground text-sm sm:text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          Cancel
        </button>
      )}
      {!(onSubmit || onCancel) && (
        <button
          type="button"
          onClick={handleSkipAndJoinWaitlist}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-1.5 px-3 sm:px-[13px] h-[31.9965px] rounded-full bg-surface-3 text-foreground text-sm sm:text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
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
        type="button"
        onClick={handleCreateBounty}
        disabled={isSubmitting || !formFields.title}
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
  );
}

export function BountyForm({
  initialValues,
  entryId,
  onSubmit,
  onCancel,
}: BountyFormProps) {
  const {
    formFields,
    setFormFields,
    isSubmitting,
    titleRef,
    priceRef,
    descriptionRef,
    titlePopoverOpen,
    setTitlePopoverOpen,
    pricePopoverOpen,
    setPricePopoverOpen,
    handleCreateBounty,
    handleSkipAndJoinWaitlist,
  } = useBountyFormState({ initialValues, entryId, onSubmit });

  return (
    <div className="w-full max-w-[95vw] sm:max-w-[703px] mx-auto">
      <div className="w-full min-h-[140px] sm:min-h-[180px] rounded-[12px] sm:rounded-[21px] bg-surface-1 border border-border-subtle flex flex-col px-2 sm:px-0">
        <BountyFormChips
          formFields={formFields}
          setFormFields={setFormFields}
          titleRef={titleRef}
          priceRef={priceRef}
          titlePopoverOpen={titlePopoverOpen}
          setTitlePopoverOpen={setTitlePopoverOpen}
          pricePopoverOpen={pricePopoverOpen}
          setPricePopoverOpen={setPricePopoverOpen}
        />

        <div className="px-2 sm:px-[19px] py-1 sm:py-1.5 flex-1 flex">
          <textarea
            ref={descriptionRef}
            value={formFields.description}
            onChange={(e) =>
              setFormFields((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Start typing your description..."
            className="w-full bg-transparent text-text-tertiary text-sm sm:text-base outline-none placeholder:text-text-tertiary resize-none min-h-[80px] sm:min-h-[100px]"
          />
        </div>

        <BountyFormFooter
          onCancel={onCancel}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          formFields={formFields}
          handleSkipAndJoinWaitlist={handleSkipAndJoinWaitlist}
          handleCreateBounty={handleCreateBounty}
        />
      </div>
      <div className="text-text-tertiary text-[10px] sm:text-sm text-center pt-2 sm:pt-3 px-2 sm:px-0">
        Creating a draft bounty is optional. This step is not required to sign
        up.
      </div>
    </div>
  );
}
