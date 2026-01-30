'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { trpcClient } from '@/utils/trpc';
import { LinearIssue } from '@bounty/api/driver/linear-client';
import { z } from 'zod';
import { Loader2, X, DollarSign, Calendar, Tag } from 'lucide-react';

const bountyFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, 'Invalid amount'),
  currency: z.string().optional(),
  deadline: z
    .string()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date',
    }),
  tags: z.array(z.string()).optional(),
});

type BountyForm = z.infer<typeof bountyFormSchema>;

interface CreateBountyFormProps {
  issue: LinearIssue;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateBountyForm({ issue, onCancel, onSuccess }: CreateBountyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BountyForm>({
    resolver: zodResolver(bountyFormSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description ?? '',
      amount: '',
      currency: 'USD',
      deadline: '',
      tags: [],
    },
  });

  const tags = watch('tags') ?? [];
  const amount = watch('amount');

  const createBountyMutation = useMutation({
    mutationFn: async (data: BountyForm) => {
      return await trpcClient.bounties.createBounty.mutate({
        title: data.title,
        description: data.description,
        amount: data.amount,
        currency: (data.currency ?? 'USD') as 'USD' | 'EUR' | 'GBP',
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
        payLater: true,
        linearIssueId: issue.id,
        linearIssueIdentifier: issue.identifier,
        linearIssueUrl: issue.url,
      });
    },
    onSuccess: (result) => {
      toast.success('Bounty created!');
      queryClient.invalidateQueries({ queryKey: [['bounties']] });

      trpcClient.linear.postComment
        .mutate({
          linearIssueId: issue.id,
          commentType: 'bountyCreated',
          bountyData: {
            title: issue.title,
            amount: amount,
            currency: 'USD',
            bountyUrl: `${window.location.origin}/bounty/${result.data?.id ?? ''}`,
          },
        })
        .catch((commentError) => {
          console.error('Failed to post comment to Linear:', commentError);
        });

      onSuccess();

      if (result.data?.id) {
        router.push(`/bounty/${result.data.id}`);
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create bounty:', error);
      toast.error(error.message || 'Failed to create bounty');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: BountyForm) => {
    setIsSubmitting(true);
    createBountyMutation.mutate(data);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Create Bounty</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-neutral-500 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          {...register('title')}
          type="text"
          className="w-full h-9 px-3 rounded-lg border border-white/10 bg-transparent text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="Enter bounty title"
        />
        {errors.title && (
          <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-transparent text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-white/20 resize-none transition-colors"
          placeholder="Describe the bounty requirements"
        />
        {errors.description && (
          <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Amount <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              {...register('amount')}
              type="text"
              inputMode="decimal"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-white/10 bg-transparent text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="0.00"
            />
          </div>
          <select
            {...register('currency')}
            className="h-9 px-3 rounded-lg border border-white/10 bg-transparent text-sm text-foreground focus:outline-none focus:border-white/20 transition-colors"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        {errors.amount && (
          <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>
        )}
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          Deadline (optional)
        </label>
        <input
          {...register('deadline')}
          type="date"
          min={new Date().toISOString().split('T')[0]}
          className="w-full h-9 px-3 rounded-lg border border-white/10 bg-transparent text-sm text-foreground focus:outline-none focus:border-white/20 transition-colors"
        />
        {errors.deadline && (
          <p className="text-xs text-red-400 mt-1">{errors.deadline.message}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          Tags (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 px-3 rounded-lg border border-white/10 bg-transparent text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={addTag}
            className="h-9 px-4 rounded-lg border border-white/10 text-sm text-foreground hover:bg-white/5 transition-colors"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 text-xs text-foreground"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-10 rounded-lg border border-white/10 text-sm text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !amount}
          className="flex-1 h-10 rounded-lg bg-white text-sm font-medium text-black hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create bounty'
          )}
        </button>
      </div>

      <p className="text-xs text-neutral-600 text-center">
        Bounty will be created in draft status. You can fund it later.
      </p>
    </form>
  );
}
