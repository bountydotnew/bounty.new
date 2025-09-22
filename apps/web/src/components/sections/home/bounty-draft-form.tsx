'use client';

import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useDrafts } from '@bounty/ui/hooks/use-drafts';
import { cn } from '@bounty/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { baseUrl } from '../../../../../../packages/ui/src/lib/constants';

const bountyDraftSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, 'Enter a valid amount'),
});

type BountyDraftForm = z.infer<typeof bountyDraftSchema>;

interface BountyDraftFormProps {
  className?: string;
}

export function BountyDraftForm({ className }: BountyDraftFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const { saveDraft } = useDrafts();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BountyDraftForm>({
    resolver: zodResolver(bountyDraftSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: '',
    },
  });

  function handleCreateDraft(data: BountyDraftForm) {
    saveDraft(data.title, data.description, data.amount);
    setSuccess(true);
    reset();
    toast.success('Draft saved! Redirecting to dashboard...');

    setTimeout(() => {
      // Redirect to dashboard where they can access the create bounty modal
      router.push(
        `/login?redirect=${encodeURIComponent(`${baseUrl}/dashboard`)}`
      );
    }, 1500);
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6',
        className
      )}
    >
      {success ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="font-semibold text-xl">Draft saved! 🎉</p>
          <p className="text-base text-muted-foreground">
            Redirecting you to sign in and create your bounty...
          </p>
        </div>
      ) : (
        <form
          className="mx-auto flex w-full max-w-lg flex-col gap-4"
          onSubmit={handleSubmit(handleCreateDraft)}
        >
          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="title">
              Bounty Title
            </Label>
            <Input
              className={cn(
                'bg-input/10 shadow-xs backdrop-blur-sm selection:bg-primary selection:text-primary-foreground file:text-foreground',
                errors.title && 'border-red-500'
              )}
              id="title"
              placeholder="e.g., Build a React component library"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="description">
              Brief Description
            </Label>
            <textarea
              className={cn(
                'w-full rounded-lg border bg-input/10 px-3 py-2 text-foreground backdrop-blur-sm placeholder:text-muted-foreground',
                errors.description ? 'border-red-500' : 'border-border'
              )}
              id="description"
              placeholder="Describe what needs to be built..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="amount">
              Bounty Amount (USD)
            </Label>
            <Input
              className={cn(
                'bg-input/10 shadow-xs backdrop-blur-sm selection:bg-primary selection:text-primary-foreground file:text-foreground',
                errors.amount && 'border-red-500'
              )}
              id="amount"
              placeholder="$500.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>

          <Button
            className="h-10 rounded-lg bg-white px-4 py-2 text-black shadow-xs transition-[color,box-shadow] hover:bg-white/90"
            type="submit"
          >
            Sign in & create
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="text-center text-muted-foreground text-sm">
        <p>Start creating your bounty. Sign in to post it live.</p>
      </div>
    </div>
  );
}
