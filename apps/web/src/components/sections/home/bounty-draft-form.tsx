"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDrafts } from "@/hooks/use-drafts";
import { baseUrl } from "@/lib/constants";


const bountyDraftSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, "Enter a valid amount"),
});

type BountyDraftForm = z.infer<typeof bountyDraftSchema>;

interface BountyDraftFormProps {
    className?: string;
}

export function BountyDraftForm({ className }: BountyDraftFormProps) {
    const router = useRouter();
    const [success, setSuccess] = useState(false);
    const { saveDraft } = useDrafts();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<BountyDraftForm>({
        resolver: zodResolver(bountyDraftSchema),
        defaultValues: {
            title: "",
            description: "",
            amount: "",
        },
    });

    function handleCreateDraft(data: BountyDraftForm) {
        const draftId = saveDraft(data.title, data.description, data.amount);
        setSuccess(true);
        reset();
        toast.success("Draft saved! Redirecting to login...");

        setTimeout(() => {
            const redirectUrl = `${baseUrl}/bounty/create?draft=${draftId}`;
            router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        }, 1500);
    }

    return (
        <div
            className={cn(
                "mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6",
                className,
            )}
        >
            {success ? (
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xl font-semibold">
                        Draft saved! 🎉
                    </p>
                    <p className="text-base text-muted-foreground">
                        Redirecting you to sign in and create your bounty...
                    </p>
                </div>
            ) : (
                <form
                    className="mx-auto flex w-full max-w-lg flex-col gap-4"
                    onSubmit={handleSubmit(handleCreateDraft)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Bounty Title
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g., Build a React component library"
                            className={cn(
                                "file:text-foreground selection:bg-primary selection:text-primary-foreground bg-input/10 backdrop-blur-sm shadow-xs",
                                errors.title && "border-red-500"
                            )}
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Brief Description
                        </Label>
                        <textarea
                            id="description"
                            rows={3}
                            placeholder="Describe what needs to be built..."
                            className={cn(
                                "w-full px-3 py-2 border rounded-lg bg-input/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground",
                                errors.description ? "border-red-500" : "border-border"
                            )}
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                            Bounty Amount (USD)
                        </Label>
                        <Input
                            id="amount"
                            placeholder="$500.00"
                            className={cn(
                                "file:text-foreground selection:bg-primary selection:text-primary-foreground bg-input/10 backdrop-blur-sm shadow-xs",
                                errors.amount && "border-red-500"
                            )}
                            {...register("amount")}
                        />
                        {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount.message}</p>
                        )}
                    </div>

                    <Button
                        className="rounded-lg transition-[color,box-shadow] bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 px-4 py-2"
                        type="submit"
                    >
                        <>
                            Sign in & create
                            <ArrowRight className="h-4 w-4" />
                        </>
                    </Button>
                </form>
            )}

            <div className="text-center text-sm text-muted-foreground">
                <p>Start creating your bounty. Sign in to post it live.</p>
            </div>
        </div>
    );
} 