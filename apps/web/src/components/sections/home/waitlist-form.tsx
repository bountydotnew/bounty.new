"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NumberFlow from "@/components/ui/number-flow";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useConfetti } from "@/lib/context/confetti-context";

const formSchema = z.object({
  email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

function useWaitlistCount() {
  const queryClient = useQueryClient();
  const { celebrate } = useConfetti();

  const query = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());

  const [success, setSuccess] = useState(false);

  const { mutate, isPending } = useMutation({
    ...trpc.earlyAccess.joinWaitlist.mutationOptions(),
    onSuccess: (data) => {
      setSuccess(true);
      if (data.message === "You've been added to the waitlist!") {
        celebrate();
        queryClient.setQueryData(
          trpc.earlyAccess.getWaitlistCount.queryKey(),
          (oldData: { count: number } | undefined) => ({
            count: (oldData?.count ?? 0) + 1,
          }),
        );
      } else {
        toast.info("You're already on the waitlist! 🎉");
      }
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  return { count: query.data?.count ?? 0, mutate, success, isPending };
}

interface WaitlistFormProps {
  className?: string;
}

export function WaitlistForm({ className }: WaitlistFormProps) {
  const { register, handleSubmit } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const waitlist = useWaitlistCount();

  function joinWaitlist({ email }: FormSchema) {
    waitlist.mutate({ email });
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6",
        className,
      )}
    >
      {waitlist.success ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl font-semibold">
            You&apos;re on the waitlist! 🎉
          </p>
          <p className="text-base text-muted-foreground">
            We&apos;ll let you know when we&apos;re ready to show you what
            we&apos;ve been working on.
          </p>
        </div>
      ) : (
        <form
          className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={handleSubmit(joinWaitlist)}
        >
          <Input
            placeholder="grim@0.email"
            className="file:text-foreground selection:bg-primary selection:text-primary-foreground bg-input/10 backdrop-blur-sm shadow-xs flex h-9 w-full min-w-0 px-3 py-1 outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive border border-border z-10 rounded-lg text-base text-foreground placeholder:text-muted-foreground"
            {...register("email")}
            disabled={waitlist.isPending}
          />
          <Button
            className="rounded-lg transition-[color,box-shadow] [&_svg]:size-4 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10"
            type="submit"
            disabled={waitlist.isPending}
          >
            Join Waitlist <ChevronRight className="h-5 w-5" />
          </Button>
        </form>
      )}

      <div className="relative flex flex-row items-center justify-center gap-2">
        <span className="size-2 rounded-full bg-green-600 dark:bg-green-400" />
        <span className="absolute left-0 size-2 rounded-full bg-green-600 blur-xs dark:bg-green-400" />
        <span className="text-sm text-green-600 sm:text-base dark:text-green-400">
          <NumberFlow value={waitlist.count} /> {waitlist.count === 1 ? 'person' : 'people'} already joined
        </span>
      </div>
    </div>
  );
}
