"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDrafts, StoredDraft } from "@/hooks/use-drafts";
import { DraftNavigator } from "@/components/sections/home/draft-navigator";
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
import { LINKS } from "@/constants/links";




function CreateBountyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const draftId = searchParams.get("draft");
  const { getDraft, getDrafts, setActiveDraft, deleteActiveDraft } = useDrafts();

  const [availableDrafts, setAvailableDrafts] = useState<StoredDraft[]>([]);
  const [showDraftNavigator, setShowDraftNavigator] = useState(false);

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: createBountyDefaults,
  });

    const { control, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = form;

  // Check for available drafts on mount
  useEffect(() => {
    const drafts = getDrafts();
    
    // Only show navigator if there are multiple drafts AND no specific draft is being loaded from URL
    if (drafts.length > 1 && !draftId) {
      setAvailableDrafts(drafts);
      setShowDraftNavigator(true);
    }
  }, [getDrafts, draftId]);

  // Load specific draft from URL parameter
  useEffect(() => {
    if (draftId) {
      const draft = getDraft(draftId);
      
      if (draft) {
        setValue("title", draft.title);
        setValue("description", draft.description);
        setValue("amount", draft.amount);
        setValue("requirements", bountyDraftTemplates.requirements);
        setValue("deliverables", bountyDraftTemplates.deliverables);
        setActiveDraft(draftId);
        toast.success("Draft loaded! Complete the remaining details to publish your bounty.");
      } else {
        toast.error("Draft not found. Starting with a blank form.");
      }
    }
  }, [draftId, setValue, getDraft, setActiveDraft]);



  const handlePreviewDraft = (draft: StoredDraft) => {
    setValue("title", draft.title);
    setValue("description", draft.description);
    setValue("amount", draft.amount);
    setValue("requirements", bountyDraftTemplates.requirements);
    setValue("deliverables", bountyDraftTemplates.deliverables);
    // Don't set active draft or show toast - this is just a preview
  };

  const handleLoadDraft = (draft: StoredDraft) => {
    setValue("title", draft.title);
    setValue("description", draft.description);
    setValue("amount", draft.amount);
    setValue("requirements", bountyDraftTemplates.requirements);
    setValue("deliverables", bountyDraftTemplates.deliverables);
    setActiveDraft(draft.id);
    setShowDraftNavigator(false);
    toast.success("Draft loaded successfully!");
  };

    const createBounty = useMutation({
    ...trpc.bounties.create.mutationOptions(),
    onSuccess: (data) => {
      deleteActiveDraft();
      toast.success("Bounty created successfully!");
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.push(`/bounty/${data.data.id}`);
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



  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-8 pb-0 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Bounty</h1>
          {draftId && (
            <p className="text-sm text-muted-foreground mt-2">
              Completing bounty from draft • Fill in the remaining details to publish
            </p>
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="p-8 pt-0 max-w-4xl mx-auto w-full">
          <form onSubmit={onSubmit} className={`space-y-6 ${showDraftNavigator ? 'pb-20' : 'pb-6'}`}>
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
                rows={4}
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
                rows={3}
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
                rows={3}
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

        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            disabled={isSubmitting || createBounty.isPending}
            className="flex-1"
          >
            {createBounty.isPending ? "Creating..." : "Create Bounty"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isSubmitting || createBounty.isPending}
          >
            Reset Form
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.replace(LINKS.BOUNTIES)}
            disabled={isSubmitting || createBounty.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
        </div>
      </div>

      {showDraftNavigator && (
        <DraftNavigator
          drafts={availableDrafts}
          onPreviewDraft={handlePreviewDraft}
          onLoadDraft={handleLoadDraft}
          onClose={() => setShowDraftNavigator(false)}
        />
      )}
    </div>
  );
}

export default function CreateBountyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateBountyContent />
    </Suspense>
  );
} 