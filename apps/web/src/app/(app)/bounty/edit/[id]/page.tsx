"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, Suspense } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { 
  createBountySchema, 
  CreateBountyForm, 
  currencyOptions,
  difficultyOptions,
  formatFormData,
  parseTagsInput,
  formatTagsOutput
} from "@/lib/forms";

function EditBountyContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bountyId = params.id as string;

  const bountyQuery = useQuery(trpc.bounties.getById.queryOptions({ id: bountyId }));

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = form;

  useEffect(() => {
    if (bountyQuery.data?.data) {
      const bounty = bountyQuery.data.data;
      
      setValue("title", bounty.title);
      setValue("description", bounty.description);
      setValue("requirements", bounty.requirements || "");
      setValue("deliverables", bounty.deliverables || "");
      setValue("amount", bounty.amount.toString());
      setValue("currency", bounty.currency);
      setValue("difficulty", bounty.difficulty);
      setValue("deadline", bounty.deadline ? new Date(bounty.deadline).toISOString().slice(0, 16) : "");
      setValue("tags", bounty.tags || []);
      setValue("repositoryUrl", bounty.repositoryUrl || "");
      setValue("issueUrl", bounty.issueUrl || "");
    }
  }, [bountyQuery.data, setValue]);

  const updateBounty = useMutation({
    ...trpc.bounties.update.mutationOptions(),
    onSuccess: () => {
      toast.success("Bounty updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.push(`/bounty/${bountyId}`);
    },
    onError: (error) => {
      toast.error(`Failed to update bounty: ${error.message}`);
    },
  });

  const onSubmit = handleSubmit((data: CreateBountyForm) => {
    const formattedData = formatFormData.createBounty(data);
    updateBounty.mutate({ id: bountyId, ...formattedData });
  });

  const tagsInput = watch("tags");
  const handleTagsChange = (value: string) => {
    const tags = parseTagsInput(value);
    setValue("tags", tags);
  };

  const handleCancel = () => {
    router.back();
  };

  if (bountyQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-32 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (bountyQuery.error || !bountyQuery.data?.data) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Bounty Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The bounty you're trying to edit could not be found.
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-8 pb-0 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <Button 
            onClick={handleCancel}
            variant="outline" 
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Bounty</h1>
          <p className="text-muted-foreground mt-2">
            Update your bounty details
          </p>
        </div>
      </div>

      <div className="flex-1">
        <div className="p-8 pt-0 max-w-4xl mx-auto w-full">
          <form onSubmit={onSubmit} className="space-y-6 pb-6">
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
                    className={`w-full px-3 py-2 border rounded-md ${errors.description ? "border-red-500" : "border-gray-300"}`}
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
                    className={`w-full px-3 py-2 border rounded-md ${errors.requirements ? "border-red-500" : "border-gray-300"}`}
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
                    className={`w-full px-3 py-2 border rounded-md ${errors.deliverables ? "border-red-500" : "border-gray-300"}`}
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
                    className={`w-full px-3 py-2 border rounded-md ${errors.difficulty ? "border-red-500" : "border-gray-300"}`}
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
                disabled={isSubmitting || updateBounty.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBounty.isPending ? "Updating..." : "Update Bounty"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting || updateBounty.isPending}
              >
                Reset Changes
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || updateBounty.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditBountyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditBountyContent />
    </Suspense>
  );
} 