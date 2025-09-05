'use client';

import type { AppRouter } from '@bounty/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Favicon } from '@/components/ui/favicon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type BetaApplicationForm,
  betaApplicationDefaults,
  betaApplicationSchema,
} from '@/lib/forms';
import { trpc } from '@/utils/trpc';

interface BetaApplicationFormProps {
  onSubmit?: (data: BetaApplicationForm) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  className?: string;
}

export function BetaApplicationForm({
  onSubmit,
  onCancel,
  onSuccess,
  className,
}: BetaApplicationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BetaApplicationForm>({
    resolver: zodResolver(betaApplicationSchema),
    defaultValues: betaApplicationDefaults,
  });

  const projectLink = watch('projectLink');

  const { data: existingSubmission } = useQuery({
    ...trpc.betaApplications.checkExisting.queryOptions(),
  });

  const submitMutation = useMutation({
    ...trpc.betaApplications.create.mutationOptions(),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      reset();
      if (onSuccess) {
        onSuccess();
      }
      if (onSubmit) {
        onSubmit({} as BetaApplicationForm);
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(
        error.message || 'Failed to submit application. Please try again.'
      );
    },
  });

  const handleFormSubmit = async (data: BetaApplicationForm) => {
    submitMutation.mutate(data);
  };

  const isFormDisabled = existingSubmission?.hasSubmitted;

  return (
    <form className={className} onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-medium text-foreground text-sm" htmlFor="name">
            Your name*
          </label>
          <Input
            id="name"
            placeholder="Ahmet"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
            disabled={isFormDisabled}
          />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="font-medium text-foreground text-sm"
            htmlFor="twitter"
          >
            Twitter handle
          </label>
          <Input
            id="twitter"
            placeholder="@bruvimtired"
            {...register('twitter')}
            className={errors.twitter ? 'border-destructive' : ''}
            disabled={isFormDisabled}
          />
          {errors.twitter && (
            <p className="text-destructive text-sm">{errors.twitter.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="font-medium text-foreground text-sm"
            htmlFor="projectName"
          >
            Project name*
          </label>
          <Input
            id="projectName"
            placeholder="oss.now"
            {...register('projectName')}
            className={errors.projectName ? 'border-destructive' : ''}
            disabled={isFormDisabled}
          />
          {errors.projectName && (
            <p className="text-destructive text-sm">
              {errors.projectName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="font-medium text-foreground text-sm"
            htmlFor="projectLink"
          >
            Project link*
          </label>
          <div className="relative">
            <Input
              id="projectLink"
              placeholder="https://oss.now"
              {...register('projectLink')}
              className={`${errors.projectLink ? 'border-destructive' : ''} ${projectLink ? 'pl-10' : ''}`}
              disabled={isFormDisabled}
            />
            {projectLink && (
              <div className="-translate-y-1/2 absolute top-1/2 left-3">
                <Favicon size={16} url={projectLink} />
              </div>
            )}
          </div>
          {errors.projectLink && (
            <p className="text-destructive text-sm">
              {errors.projectLink.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="font-medium text-foreground text-sm"
            htmlFor="description"
          >
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Enter project description"
            rows={6}
            {...register('description')}
            className={errors.description ? 'border-destructive' : ''}
            disabled={isFormDisabled}
          />
          {errors.description && (
            <p className="text-destructive text-sm">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {existingSubmission?.hasSubmitted ? (
          <div className="w-full py-4 text-center">
            <p className="font-medium text-green-600 text-lg">
              You&apos;ll hear from us shortly!
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              Your beta application has been submitted and is under review.
            </p>
          </div>
        ) : (
          <>
            <Button
              className="flex-1"
              disabled={isSubmitting || submitMutation.isPending}
              type="submit"
            >
              {isSubmitting || submitMutation.isPending
                ? 'Submitting...'
                : 'Submit Application'}
            </Button>
            {onCancel && (
              <Button onClick={onCancel} type="button" variant="outline">
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
