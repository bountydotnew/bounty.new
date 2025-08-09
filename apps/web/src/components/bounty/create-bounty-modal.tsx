"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDrafts } from "@/hooks/use-drafts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createBountySchema,
  CreateBountyForm,
  createBountyDefaults,
  bountyDraftTemplates,
  currencyOptions,
  difficultyOptions,
  formatFormData,
  parseTagsInput,
  formatTagsOutput
} from "@/lib/forms";

interface CreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
}

export function CreateBountyModal({ open, onOpenChange, draftId, initialValues, redirectOnClose, replaceOnSuccess }: CreateBountyModalProps) {
  const queryClient = useQueryClient();
  const { getDraft, deleteActiveDraft } = useDrafts();
  const router = useRouter();

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      ...createBountyDefaults,
      ...(initialValues || {}),
    },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = form;

  // Load draft data if draftId is provided
  useEffect(() => {
    if (draftId && open) {
      const draft = getDraft(draftId);
      if (draft) {
        setValue("title", draft.title);
        setValue("description", draft.description);
        toast.success("Draft loaded! Complete the remaining details.");
      }
    }
  }, [draftId, open, getDraft, setValue]);

  useEffect(() => {
    if (open && initialValues) {
      reset({ ...createBountyDefaults, ...initialValues });
    }
  }, [open, initialValues, reset]);
  const createBounty = useMutation({
    ...trpc.bounties.createBounty.mutationOptions(),
    onSuccess: (result) => {
      if (draftId) {
        deleteActiveDraft();
      }
      toast.success("Bounty created successfully!");

      // Invalidate all bounty-related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["bounties"],
        type: "all"
      });

      reset();
      onOpenChange(false);
      if (result?.data?.id) {
        const href = `/bounty/${result.data.id}${replaceOnSuccess ? "?from=gh-issue" : ""}`;
        if (replaceOnSuccess) router.replace(href);
        else router.push(href);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create bounty: ${error.message}`);
    },
  });

  const onSubmit = handleSubmit((data: CreateBountyForm) => {
    const formattedData = formatFormData.createBounty(data);
    createBounty.mutate(formattedData);
  });

  const tagsInput = watch("tags");
  const handleTagsChange = (value: string) => {
    const tags = parseTagsInput(value);
    setValue("tags", tags);
  };

  const handleClose = () => {
    if (!isSubmitting && !createBounty.isPending) {
      reset();
      onOpenChange(false);
      if (redirectOnClose) {
        router.push(redirectOnClose);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[92vw] max-w-lg md:max-w-lg lg:max-w-lg max-h-[75vh] overflow-y-auto p-0 sm:rounded-lg" showOverlay>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Create New Bounty</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="px-6 pb-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="title"
                  placeholder="Enter bounty title"
                  className={errors.title ? "border-red-500" : ""}
                />
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="description"
                  rows={3}
                  placeholder="Describe what needs to be done"
                  className={`w-full px-3 py-2 border rounded-md ${errors.description ? "border-red-500" : "border-border"
                    }`}
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* temporarily removed requirements */}

          {/* temporarily removed deliverables */}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="amount"
                    placeholder="100.00"
                    className={errors.amount ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="currency"
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="difficulty"
                  className={`w-full px-3 py-2 border rounded-md ${errors.difficulty ? "border-red-500" : "border-border"
                    }`}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.difficulty && (
              <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>
            )}
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Controller
              name="deadline"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="deadline"
                  type="datetime-local"
                  className={errors.deadline ? "border-red-500" : ""}
                />
              )}
            />
            {errors.deadline && (
              <p className="text-red-500 text-sm mt-1">{errors.deadline.message}</p>
            )}
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="javascript, react, node (comma-separated)"
              onChange={(e) => handleTagsChange(e.target.value)}
              defaultValue={tagsInput ? formatTagsOutput(tagsInput) : ""}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter tags separated by commas
            </p>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
            <Controller
              name="repositoryUrl"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="repositoryUrl"
                  type="url"
                  placeholder="https://github.com/user/repo"
                  className={errors.repositoryUrl ? "border-red-500" : ""}
                />
              )}
            />
            {errors.repositoryUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.repositoryUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
            <Controller
              name="issueUrl"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="issueUrl"
                  type="url"
                  placeholder="https://github.com/user/repo/issues/123"
                  className={errors.issueUrl ? "border-red-500" : ""}
                />
              )}
            />
            {errors.issueUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.issueUrl.message}</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createBounty.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createBounty.isPending}
            >
              {createBounty.isPending ? "Creating..." : "Create Bounty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}