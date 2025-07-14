"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const createBountySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),
  deliverables: z.string().min(10, "Deliverables must be at least 10 characters"),
  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, "Incorrect amount."),
  currency: z.string().min(1, "Currency is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  deadline: z.string().optional(),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  issueUrl: z.string().url().optional().or(z.literal("")),
});

type CreateBountyForm = z.infer<typeof createBountySchema>;

export default function CreateBountyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      deliverables: "",
      amount: "",
      currency: "USD",
      difficulty: "intermediate",
      deadline: "",
      tags: [],
      repositoryUrl: "",
      issueUrl: "",
    },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = form;

  const createBounty = useMutation({
    ...trpc.bounties.create.mutationOptions(),
    onSuccess: (data) => {
      toast.success("Bounty created successfully!");
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.push(`/bounty/${data.data.id}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create bounty: ${error.message}`);
    },
  });

  const onSubmit = handleSubmit((data: CreateBountyForm) => {
    const formattedData = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
      repositoryUrl: data.repositoryUrl || undefined,
      issueUrl: data.issueUrl || undefined,
    };
    createBounty.mutate(formattedData);
  });

  const tagsInput = watch("tags");
  const handleTagsChange = (value: string) => {
    const tags = value.split(",").map(tag => tag.trim()).filter(Boolean);
    setValue("tags", tags);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Bounty</h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Title */}
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

        {/* Description */}
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
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
            )}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Requirements */}
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
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.requirements ? "border-red-500" : "border-gray-300"
                }`}
              />
            )}
          />
          {errors.requirements && (
            <p className="text-red-500 text-sm mt-1">{errors.requirements.message}</p>
          )}
        </div>

        {/* Deliverables */}
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
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.deliverables ? "border-red-500" : "border-gray-300"
                }`}
              />
            )}
          />
          {errors.deliverables && (
            <p className="text-red-500 text-sm mt-1">{errors.deliverables.message}</p>
          )}
        </div>

        {/* Amount and Currency */}
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
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <Label htmlFor="difficulty">Difficulty *</Label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="difficulty"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.difficulty ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            )}
          />
          {errors.difficulty && (
            <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>
          )}
        </div>

        {/* Deadline */}
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

        {/* Tags */}
        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            placeholder="javascript, react, node (comma-separated)"
            onChange={(e) => handleTagsChange(e.target.value)}
            defaultValue={tagsInput?.join(", ") || ""}
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter tags separated by commas
          </p>
        </div>

        {/* Repository URL */}
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

        {/* Issue URL */}
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

        {/* Submit Buttons */}
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
            onClick={() => router.back()}
            disabled={isSubmitting || createBounty.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 