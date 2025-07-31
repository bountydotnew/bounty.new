"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
}

export function CreateBountyModal({ open, onOpenChange, draftId }: CreateBountyModalProps) {
  const queryClient = useQueryClient();
  const { getDraft, deleteActiveDraft } = useDrafts();

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: createBountyDefaults,
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = form;

  // Load draft data if draftId is provided
  useEffect(() => {
    if (draftId && open) {
      const draft = getDraft(draftId);
      if (draft) {
        setValue("title", draft.title);
        setValue("description", draft.description);
        setValue("requirements", draft.requirements || bountyDraftTemplates.requirements);
        setValue("deliverables", draft.deliverables || bountyDraftTemplates.deliverables);
        toast.success("Draft loaded! Complete the remaining details.");
      }
    }
  }, [draftId, open, getDraft, setValue]);

  const createBounty = useMutation({
    ...trpc.bounties.createBounty.mutationOptions(),
    onSuccess: () => {
      if (draftId) {
        deleteActiveDraft();
      }
      toast.success("Bounty created successfully!");

      // Invalidate all bounty-related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: [["bounties"]],
        type: "all"
      });

      reset();
      onOpenChange(false);
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" showOverlay>
        <DialogHeader>
          <DialogTitle>Create New Bounty</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
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

          <div>
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
                  className={`w-full px-3 py-2 border rounded-md ${errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="requirements">Requirements *</Label>
            <Controller
              name="requirements"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="requirements"
                  rows={2}
                  placeholder="List the technical requirements"
                  className={`w-full px-3 py-2 border rounded-md ${errors.requirements ? "border-red-500" : "border-gray-300"
                    }`}
                />
              )}
            />
            {errors.requirements && (
              <p className="text-red-500 text-sm mt-1">{errors.requirements.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deliverables">Deliverables *</Label>
            <Controller
              name="deliverables"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="deliverables"
                  rows={2}
                  placeholder="What should be delivered?"
                  className={`w-full px-3 py-2 border rounded-md ${errors.deliverables ? "border-red-500" : "border-gray-300"
                    }`}
                />
              )}
            />
            {errors.deliverables && (
              <p className="text-red-500 text-sm mt-1">{errors.deliverables.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
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

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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

          <div>
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="difficulty"
                  className={`w-full px-3 py-2 border rounded-md ${errors.difficulty ? "border-red-500" : "border-gray-300"
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

          <div>
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
          </div>

          <div>
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
          </div>

          <div>
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

          <div>
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

          <DialogFooter>
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