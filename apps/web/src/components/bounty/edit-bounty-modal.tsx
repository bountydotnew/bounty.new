"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  createBountySchema,
  CreateBountyForm,
  createBountyDefaults,
  currencyOptions,
  difficultyOptions,
  formatFormData
} from "@/lib/forms";

interface EditBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
}

export function EditBountyModal({
  open,
  onOpenChange,
  bountyId,
}: EditBountyModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const bountyQuery = useQuery({
    ...trpc.bounties.fetchBountyById.queryOptions({ id: bountyId }),
    enabled: open && !!bountyId,
  });

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: createBountyDefaults,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    //watch,
    setValue,
  } = form;

  // Load bounty data when modal opens
  useEffect(() => {
    if (bountyQuery.data?.data && open) {
      const bounty = bountyQuery.data.data;
      
      reset({
        title: bounty.title,
        description: bounty.description,
        amount: bounty.amount.toString(),
        currency: bounty.currency,
        difficulty: bounty.difficulty,
        deadline: bounty.deadline
          ? new Date(bounty.deadline).toISOString().slice(0, 16)
          : "",
        tags: bounty.tags || [],
        repositoryUrl: bounty.repositoryUrl || "",
        issueUrl: bounty.issueUrl || "",
      });
    }
  }, [bountyQuery.data, open, reset]);

  const updateBounty = useMutation({
    ...trpc.bounties.updateBounty.mutationOptions(),
    onSuccess: () => {
      toast.success("Bounty updated successfully!");

      // Invalidate all bounty-related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["bounties"],
        type: "all",
      });
      // Invalidate and refetch the specific bounty detail query
      const detailKey = trpc.bounties.fetchBountyById.queryOptions({
        id: bountyId,
      }).queryKey;
      queryClient.invalidateQueries({ queryKey: detailKey });
      queryClient.refetchQueries({ queryKey: detailKey });

      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to update bounty: ${error.message}`);
    },
  });

  const onSubmit = handleSubmit((data: CreateBountyForm) => {
    const formattedData = formatFormData.createBounty(data);
    updateBounty.mutate({ id: bountyId, ...formattedData });
  });

  const handleClose = () => {
    if (!isSubmitting && !updateBounty.isPending) {
      reset(createBountyDefaults);
      onOpenChange(false);
    }
  };

  if (bountyQuery.isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="w-[92vw] max-w-lg md:max-w-lg lg:max-w-lg max-h-[75vh] overflow-y-auto p-0 sm:rounded-lg"
          showOverlay
        >
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (bountyQuery.error || !bountyQuery.data?.data) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="w-[92vw] max-w-lg md:max-w-lg lg:max-w-lg p-0 sm:rounded-lg"
          showOverlay
        >
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl">Error</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground">
            Failed to load bounty data. Please try again.
          </p>
          <DialogFooter>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-[92vw] max-w-lg md:max-w-lg lg:max-w-lg max-h-[75vh] overflow-y-auto p-0 sm:rounded-lg"
        showOverlay
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Edit Bounty</DialogTitle>
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
                    className={errors.title ? "border-red-500" : "border-border"}
                  />
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
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
                  className={`w-full px-3 py-2 border rounded-md ${errors.description ? "border-red-500" : "border-border"}`}
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>



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
                    className={errors.amount ? "border-red-500" : "border-border"}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.amount.message}
                </p>
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
                    className={`w-full px-3 py-2 border rounded-md ${errors.currency ? "border-red-500" : "border-border"}`}
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.currency && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.currency.message}
                </p>
              )}
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
                  className={`w-full px-3 py-2 border rounded-md ${errors.difficulty ? "border-red-500" : "border-border"}`}
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
              <p className="text-red-500 text-sm mt-1">
                {errors.difficulty.message}
              </p>
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
                    className={errors.repositoryUrl ? "border-red-500" : "border-border"}
                  />
              )}
            />
            {errors.repositoryUrl && (
              <p className="text-red-500 text-sm mt-1">
                {errors.repositoryUrl.message}
              </p>
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
                    className={errors.issueUrl ? "border-red-500" : "border-border"}
                  />
              )}
            />
            {errors.issueUrl && (
              <p className="text-red-500 text-sm mt-1">
                {errors.issueUrl.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || updateBounty.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateBounty.isPending}
            >
              {updateBounty.isPending ? "Updating..." : "Update Bounty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
