"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import NumberFlow from "@number-flow/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

function useWaitlistCount() {
  const queryClient = useQueryClient();

  const query = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());

  const [success, setSuccess] = useState(false);

  const { mutate } = useMutation(
    trpc.earlyAccess.joinWaitlist.mutationOptions({
      onSuccess: () => {
        setSuccess(true);

        queryClient.setQueryData(
          [trpc.earlyAccess.getWaitlistCount.queryKey()],
          {
            count: (query.data?.count ?? 0) + 1,
          },
        );
      },
      onError: () => {
        toast.error("Something went wrong. Please try again.");
      },
    }),
  );

  return { count: query.data?.count ?? 0, mutate, success };
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
            We&apos;ll let you know when we&#39;re ready to show you what
            we&#39;ve been working on.
          </p>
        </div>
      ) : (
        <form
          className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={handleSubmit(joinWaitlist)}
        >
          <Input
            placeholder="example@0.email"
            className="file:text-foreground selection:bg-primary selection:text-primary-foreground bg-input shadow-xs flex h-9 w-full min-w-0 px-3 py-1 outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive border border-border z-10 rounded-lg text-base text-foreground placeholder:text-muted-foreground"
            {...register("email")}
          />
          <Button
            className="nline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10"
            type="submit"
          >
            Join Waitlist <ChevronRight className="h-5 w-5" />
          </Button>
        </form>
      )}

      <div className="relative flex flex-row items-center justify-center gap-2">
        <span className="size-2 rounded-full bg-green-600 dark:bg-green-400" />
        <span className="absolute left-0 size-2 rounded-full bg-green-600 blur-xs dark:bg-green-400" />
        <span className="text-sm text-green-600 sm:text-base dark:text-green-400">
          <NumberFlow value={waitlist.count} /> people already joined
        </span>
      </div>
    </div>
  );
}
