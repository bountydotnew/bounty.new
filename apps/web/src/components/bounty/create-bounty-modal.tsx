'use client';

import type { AppRouter } from '@bounty/api';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@bounty/ui/components/drawer';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useDrafts } from '@bounty/ui/hooks/use-drafts';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import {
  type CreateBountyForm,
  createBountyDefaults,
  createBountySchema,
  currencyOptions,
  difficultyOptions,
  formatFormData,
} from '@bounty/ui/lib/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MarkdownTextarea } from '@/components/bounty/markdown-editor';
import { trpc, trpcClient } from '@/utils/trpc';

interface CreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
}

export function CreateBountyModal({
  open,
  onOpenChange,
  draftId,
  initialValues,
  redirectOnClose,
  replaceOnSuccess,
}: CreateBountyModalProps) {
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

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    //watch,
    setValue,
  } = form;

  // Load draft data if draftId is provided
  useEffect(() => {
    if (draftId && open) {
      const draft = getDraft(draftId);
      if (draft) {
        setValue('title', draft.title);
        setValue('description', draft.description);
        toast.success('Draft loaded! Complete the remaining details.');
      }
    }
  }, [draftId, open, getDraft, setValue]);

  useEffect(() => {
    if (open && initialValues) {
      reset({ ...createBountyDefaults, ...initialValues });
    }
  }, [open, initialValues, reset]);
  const createBounty = useMutation({
    mutationFn: async (input: CreateBountyForm) => {
      return await trpcClient.bounties.createBounty.mutate(input);
    },
    onSuccess: (result) => {
      if (draftId) {
        deleteActiveDraft();
      }
      toast.success('Bounty created successfully!');

      // Invalidate all bounty-related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['bounties'],
        type: 'all',
      });

      reset();
      onOpenChange(false);
      if (result?.data?.id) {
        const href = `/bounty/${result.data.id}${replaceOnSuccess ? '?from=gh-issue' : ''}`;
        if (replaceOnSuccess) {
          router.replace(href);
        } else {
          router.push(href);
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create bounty: ${error.message}`);
      if (error.message.toLowerCase().includes('duplicate')) {
        toast.error('Bounty with this title already exists');
      }
    },
  });

  const onSubmit = handleSubmit((data: CreateBountyForm) => {
    const formattedData = formatFormData.createBounty(data);
    createBounty.mutate(formattedData);
  });

  // const tagsInput = watch("tags");
  // const handleTagsChange = (value: string) => {
  //   const tags = parseTagsInput(value);
  //   setValue("tags", tags);
  // };

  const handleClose = () => {
    if (!(isSubmitting || createBounty.isPending)) {
      reset();
      onOpenChange(false);
      if (redirectOnClose) {
        router.push(redirectOnClose);
      }
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <Drawer
        onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}
        open={open}
      >
        <DrawerContent className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
          <DrawerHeader className="px-6 pt-4">
            <DrawerTitle className="text-white text-xl">
              Create New Bounty
            </DrawerTitle>
          </DrawerHeader>
          <form className="space-y-4 px-6 pb-6" onSubmit={onSubmit}>
            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="title">Title *</Label>
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.title ? 'border-red-500' : ''}
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

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="description">Description *</Label>
              <div className="rounded-lg border border-neutral-800 bg-[#222222] p-3">
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
              </div>
              {errors.description && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
                <Label htmlFor="amount">Amount *</Label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      {...field}
                      autoComplete="off"
                      className={errors.amount ? 'border-red-500' : ''}
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
              <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
                <Label htmlFor="currency">Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-md border px-3 py-2"
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
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full rounded-md border px-3 py-2 ${errors.difficulty ? 'border-red-500' : 'border-border'}`}
                    id="difficulty"
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
                <p className="mt-1 text-red-500 text-sm">
                  {errors.difficulty.message}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
              <Controller
                control={control}
                name="repositoryUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.repositoryUrl ? 'border-red-500' : ''}
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

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
              <Controller
                control={control}
                name="issueUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.issueUrl ? 'border-red-500' : ''}
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

            <div className="flex justify-end gap-2">
              <Button
                disabled={isSubmitting || createBounty.isPending}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting || createBounty.isPending}
                type="submit"
              >
                {createBounty.isPending ? 'Creating...' : 'Create Bounty'}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      onOpenChange={(open) => (open ? onOpenChange(open) : handleClose())}
      open={open}
    >
      <DialogContent
        className="w-[92vw] max-w-lg border border-neutral-800 bg-neutral-900/90 p-0 backdrop-blur sm:rounded-lg"
        showOverlay
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Create New Bounty</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 px-6 pb-6" onSubmit={onSubmit}>
          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label htmlFor="title">Title *</Label>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <Input
                  {...field}
                  autoComplete="off"
                  className={errors.title ? 'border-red-500' : ''}
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

          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label htmlFor="description">Description *</Label>
            <div className="rounded-lg border border-neutral-800 bg-[#222222] p-3">
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
            </div>
            {errors.description && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="amount">Amount *</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.amount ? 'border-red-500' : ''}
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

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md border px-3 py-2"
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
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.difficulty ? 'border-red-500' : 'border-border'
                  }`}
                  id="difficulty"
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
              <p className="mt-1 text-red-500 text-sm">
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

          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
            <Controller
              control={control}
              name="repositoryUrl"
              render={({ field }) => (
                <Input
                  {...field}
                  autoComplete="off"
                  className={errors.repositoryUrl ? 'border-red-500' : ''}
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

          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
            <Controller
              control={control}
              name="issueUrl"
              render={({ field }) => (
                <Input
                  {...field}
                  autoComplete="off"
                  className={errors.issueUrl ? 'border-red-500' : ''}
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
          <div className="flex justify-end gap-2">
            <Button
              disabled={isSubmitting || createBounty.isPending}
              onClick={handleClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || createBounty.isPending}
              type="submit"
            >
              {createBounty.isPending ? 'Creating...' : 'Create Bounty'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
