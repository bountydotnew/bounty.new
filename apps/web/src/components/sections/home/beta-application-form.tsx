"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@bounty/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Favicon } from "@/components/ui/favicon";
import { betaApplicationSchema, betaApplicationDefaults, type BetaApplicationForm } from "@/lib/forms";

interface BetaApplicationFormProps {
  onSubmit?: (data: BetaApplicationForm) => void;
  onCancel?: () => void;
  className?: string;
}

export function BetaApplicationForm({ onSubmit, onCancel, className }: BetaApplicationFormProps) {
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

  const projectLink = watch("projectLink");

  const { data: existingSubmission } = useQuery({
    ...trpc.betaApplications.checkExisting.queryOptions(),
  });

  const submitMutation = useMutation({
    ...trpc.betaApplications.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      reset();
      if (onSubmit) {
        onSubmit({} as BetaApplicationForm);
      }
        },
            onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || "Failed to submit application. Please try again.");
    },
  });

  const handleFormSubmit = async (data: BetaApplicationForm) => {
    submitMutation.mutate(data);
  };

  const isFormDisabled = existingSubmission?.hasSubmitted;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={className}>
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Your name*
          </label>
          <Input
            id="name"
            placeholder="Ahmet"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
            disabled={isFormDisabled}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="twitter" className="text-sm font-medium text-foreground">
            Twitter handle
          </label>
          <Input
            id="twitter"
            placeholder="@bruvimtired"
            {...register("twitter")}
            className={errors.twitter ? "border-destructive" : ""}
            disabled={isFormDisabled}
          />
          {errors.twitter && (
            <p className="text-sm text-destructive">{errors.twitter.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="projectName" className="text-sm font-medium text-foreground">
            Project name*
          </label>
          <Input
            id="projectName"
            placeholder="oss.now"
            {...register("projectName")}
            className={errors.projectName ? "border-destructive" : ""}
            disabled={isFormDisabled}
          />
          {errors.projectName && (
            <p className="text-sm text-destructive">{errors.projectName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="projectLink" className="text-sm font-medium text-foreground">
            Project link*
          </label>
          <div className="relative">
            <Input
              id="projectLink"
              placeholder="https://oss.now"
              {...register("projectLink")}
              className={`${errors.projectLink ? "border-destructive" : ""} ${projectLink ? "pl-10" : ""}`}
              disabled={isFormDisabled}
            />
            {projectLink && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Favicon url={projectLink} size={16} />
              </div>
            )}
          </div>
          {errors.projectLink && (
            <p className="text-sm text-destructive">{errors.projectLink.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Description
          </label>
          <Textarea
            id="description"
            rows={6}
            placeholder="Enter project description"
            {...register("description")}
            className={errors.description ? "border-destructive" : ""}
            disabled={isFormDisabled}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        {existingSubmission?.hasSubmitted ? (
          <div className="w-full text-center py-4">
            <p className="text-lg font-medium text-green-600">
              You&apos;ll hear from us shortly!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your beta application has been submitted and is under review.
            </p>
          </div>
        ) : (
          <>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isSubmitting || submitMutation.isPending}
            >
              {isSubmitting || submitMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
    </form>
  );
} 