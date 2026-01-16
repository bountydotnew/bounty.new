'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { Sheet, SheetContent } from '@bounty/ui/components/sheet';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import {
  type CreateBountyForm,
  createBountyDefaults,
  createBountySchema,
  currencyOptions,
  formatFormData,
} from '@bounty/ui/lib/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MarkdownTextarea } from '@/components/bounty/markdown-editor';
import { trpc, trpcClient } from '@/utils/trpc';

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
    //setValue,
  } = form;

  // Load bounty data when modal opens
  useEffect(() => {
    if (bountyQuery.data?.data && open) {
      const bounty = bountyQuery.data.data;

      reset({
        title: bounty.title,
        description: bounty.description,
        amount: '', // Price cannot be edited
        currency: 'USD', // Price cannot be edited
        deadline: bounty.deadline
          ? new Date(bounty.deadline).toISOString().slice(0, 16)
          : '',
        tags: bounty.tags || [],
        repositoryUrl: bounty.repositoryUrl || '',
        issueUrl: bounty.issueUrl || '',
      });
    }
  }, [bountyQuery.data, open, reset]);

  const updateBounty = useMutation({
    mutationFn: async (input: CreateBountyForm & { id: string }) => {
      return await trpcClient.bounties.updateBounty.mutate(input);
    },
    onSuccess: () => {
      toast.success('Bounty updated successfully!');

      // Invalidate all bounty-related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['bounties'],
        type: 'all',
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
    // Remove amount and currency - prices cannot be changed
    const { ...updateData } = formattedData;
    updateBounty.mutate({ id: bountyId, ...updateData });
  });

  const handleClose = () => {
    if (!(isSubmitting || updateBounty.isPending)) {
      reset(createBountyDefaults);
      onOpenChange(false);
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (bountyQuery.isLoading) {
    if (isMobile) {
      return (
        <Sheet onOpenChange={handleClose} open={open}>
          <SheetContent
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl p-0"
            side="bottom"
          >
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
            </div>
          </SheetContent>
        </Sheet>
      );
    }
    return (
      <Dialog onOpenChange={handleClose} open={open}>
        <DialogContent
          className="max-h-[75vh] w-[92vw] max-w-lg overflow-y-auto p-0 sm:rounded-lg md:max-w-lg lg:max-w-lg"
          overlayVariant="default"
        >
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (bountyQuery.error || !bountyQuery.data?.data) {
    if (isMobile) {
      return (
        <Sheet onOpenChange={handleClose} open={open}>
          <SheetContent
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl p-0"
            side="bottom"
          >
            <div className="px-6 pt-6 pb-4">
              <div className="font-medium text-xl">Error</div>
            </div>
            <p className="px-6 text-center text-muted-foreground">
              Failed to load bounty data. Please try again.
            </p>
            <div className="flex justify-end gap-2 px-6 py-4">
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      );
    }
    return (
      <Dialog onOpenChange={handleClose} open={open}>
        <DialogContent
          className="w-[92vw] max-w-lg p-0 sm:rounded-lg md:max-w-lg lg:max-w-lg"
          overlayVariant="default"
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

  if (isMobile) {
    return (
      <Sheet onOpenChange={handleClose} open={open}>
        <SheetContent
          className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl p-0"
          side="bottom"
        >
          <div className="px-6 pt-6 pb-2">
            <div className="font-medium text-xl">Edit Bounty</div>
          </div>
          <form className="space-y-6 px-6 pb-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <Input
                    {...field}
                    className={
                      errors.title ? 'border-red-500' : 'border-border'
                    }
                    id="title"
                    placeholder="Enter bounty title"
                  />
                )}
              />
              {errors.title && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <MarkdownTextarea
                    className={
                      errors.description ? 'border-red-500' : 'border-border'
                    }
                    id="description"
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Describe what needs to be done"
                    value={field.value}
                  />
                )}
              />
              {errors.description && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      {...field}
                      className={
                        errors.amount ? 'border-red-500' : 'border-border'
                      }
                      id="amount"
                      placeholder="100.00"
                    />
                  )}
                />
                {errors.amount && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full rounded-md border px-3 py-2 ${errors.currency ? 'border-red-500' : 'border-border'}`}
                      id="currency"
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
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.currency.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
              <Controller
                control={control}
                name="repositoryUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    className={
                      errors.repositoryUrl ? 'border-red-500' : 'border-border'
                    }
                    id="repositoryUrl"
                    placeholder="https://github.com/user/repo"
                    type="url"
                  />
                )}
              />
              {errors.repositoryUrl && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.repositoryUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
              <Controller
                control={control}
                name="issueUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    className={
                      errors.issueUrl ? 'border-red-500' : 'border-border'
                    }
                    id="issueUrl"
                    placeholder="https://github.com/user/repo/issues/123"
                    type="url"
                  />
                )}
              />
              {errors.issueUrl && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.issueUrl.message}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                disabled={isSubmitting || updateBounty.isPending}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting || updateBounty.isPending}
                type="submit"
              >
                {updateBounty.isPending ? 'Updating...' : 'Update Bounty'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent
        className="max-h-[75vh] w-[92vw] max-w-lg overflow-y-auto p-0 sm:rounded-lg md:max-w-lg lg:max-w-lg"
        overlayVariant="default"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Edit Bounty</DialogTitle>
        </DialogHeader>

        <form className="space-y-6 px-6 pb-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <Input
                  {...field}
                  className={errors.title ? 'border-red-500' : 'border-border'}
                  id="title"
                  placeholder="Enter bounty title"
                />
              )}
            />
            {errors.title && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <MarkdownTextarea
                  className={
                    errors.description ? 'border-red-500' : 'border-border'
                  }
                  id="description"
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Describe what needs to be done"
                  value={field.value}
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.description.message}
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
              control={control}
              name="repositoryUrl"
              render={({ field }) => (
                <Input
                  {...field}
                  className={
                    errors.repositoryUrl ? 'border-red-500' : 'border-border'
                  }
                  id="repositoryUrl"
                  placeholder="https://github.com/user/repo"
                  type="url"
                />
              )}
            />
            {errors.repositoryUrl && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.repositoryUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
            <Controller
              control={control}
              name="issueUrl"
              render={({ field }) => (
                <Input
                  {...field}
                  className={
                    errors.issueUrl ? 'border-red-500' : 'border-border'
                  }
                  id="issueUrl"
                  placeholder="https://github.com/user/repo/issues/123"
                  type="url"
                />
              )}
            />
            {errors.issueUrl && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.issueUrl.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              disabled={isSubmitting || updateBounty.isPending}
              onClick={handleClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || updateBounty.isPending}
              type="submit"
            >
              {updateBounty.isPending ? 'Updating...' : 'Update Bounty'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
