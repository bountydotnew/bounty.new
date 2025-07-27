"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Shield, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NumberFlow from "@/components/ui/number-flow";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useConfetti } from "@/lib/context/confetti-context";
import { getThumbmark } from "@thumbmarkjs/thumbmarkjs";
import type { thumbmarkResponse } from "@/lib/fingerprint-validation";

const formSchema = z.object({
  email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function useWaitlistSubmission() {
  const queryClient = useQueryClient();
  const { celebrate } = useConfetti();
  const [success, setSuccess] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    limit: number;
    resetTime?: string;
  } | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ email, fingerprintData }: { email: string; fingerprintData: thumbmarkResponse }) => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, fingerprintData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      setSuccess(true);
      setRateLimitInfo({
        remaining: data.remaining,
        limit: data.limit,
      });

      const cookieData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: btoa(variables.email).substring(0, 16)
      };
      setCookie("waitlist_data", JSON.stringify(cookieData), 365);

      celebrate();
      
      if (data.warning) {
        toast.warning(`${data.message} - ${data.warning}`);
      } else {
        toast.success("Successfully added to waitlist! 🎉");
      }

      // Update waitlist count optimistically only if no database error
      if (!data.warning) {
        queryClient.setQueryData(
          trpc.earlyAccess.getWaitlistCount.queryKey(),
          (oldData: { count: number } | undefined) => ({
            count: (oldData?.count ?? 0) + 1,
          }),
        );
      }
    },
    onError: (error: Error) => {
      console.error('Waitlist submission error:', error);

      if (error.message.includes("Rate limit exceeded")) {
        toast.error("You've reached the limit of 3 attempts per hour. Please try again later.");
      } else if (error.message.includes("Invalid device fingerprint")) {
        toast.error("Security validation failed. Please refresh the page and try again.");
      } else {
        toast.error(error.message || "Something went wrong. Please try again.");
      }
    },
  });

  return { mutate, isPending, success, setSuccess, rateLimitInfo };
}

function useWaitlistCount() {
  const query = useQuery({
    ...trpc.earlyAccess.getWaitlistCount.queryOptions(),
    retry: 2,
    retryDelay: 1000,
  });
  
  return { 
    count: query.data?.count ?? 0, 
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError
  };
}

interface WaitlistFormProps {
  className?: string;
}

export function WaitlistForm({ className }: WaitlistFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const [fingerprintData, setFingerprintData] = useState<thumbmarkResponse | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(true);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);

  const waitlistSubmission = useWaitlistSubmission();
  const waitlistCount = useWaitlistCount();

  useEffect(() => {
    const waitlistData = getCookie("waitlist_data");
    if (waitlistData) {
      try {
        const data = JSON.parse(waitlistData);
        if (data.submitted) {
          waitlistSubmission.setSuccess(true);
        } 
      } catch (error) {
        console.error("Error parsing waitlist cookie:", error);
      }
    }
  }, [waitlistSubmission]);

  useEffect(() => {
    // Generate device fingerprint when component mounts
    const generateFingerprint = async () => {
      try {
        setFingerprintLoading(true);
        setFingerprintError(null);
        const result = await getThumbmark();
        setFingerprintData(result);
      } catch (error) {
        console.error("Error generating fingerprint:", error);
        setFingerprintError("Unable to generate device fingerprint. Please refresh and try again.");
        toast.error("Device fingerprinting failed. Please refresh the page and try again.");
      } finally {
        setFingerprintLoading(false);
      }
    };

    generateFingerprint();
  }, []);

  async function joinWaitlist({ email }: FormSchema) {
    if (!fingerprintData) {
      toast.error("Device fingerprint not ready. Please wait a moment and try again.");
      return;
    }

    waitlistSubmission.mutate({ email, fingerprintData });
  }

  const isFormDisabled = waitlistSubmission.isPending || fingerprintLoading || !fingerprintData;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6",
        className,
      )}
    >
      {waitlistSubmission.success ? (
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
        <div className="w-full max-w-lg">
          <form
            className="mx-auto flex w-full flex-col gap-3 sm:flex-row"
            onSubmit={handleSubmit(joinWaitlist)}
          >
            <div className="flex-1">
              <Input
                placeholder="grim@0.email"
                className="file:text-foreground selection:bg-primary selection:text-primary-foreground bg-input/10 backdrop-blur-sm shadow-xs flex h-9 w-full min-w-0 px-3 py-1 outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive border border-border z-10 rounded-lg text-base text-foreground placeholder:text-muted-foreground"
                {...register("email")}
                disabled={isFormDisabled}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <Button
              className="rounded-lg transition-[color,box-shadow] [&_svg]:size-4 bg-white text-black shadow-xs hover:bg-white/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10"
              type="submit"
              disabled={isFormDisabled}
            >
              {waitlistSubmission.isPending ? (
                "Joining..."
              ) : (
                <>
                  Join Waitlist <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Security and status indicators */}
          <div className="mt-4 space-y-2">
            {fingerprintLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Shield className="h-4 w-4 animate-pulse" />
                <span>Initializing security validation...</span>
              </div>
            )}

            {fingerprintError && (
              <div className="flex items-center gap-2 text-sm text-destructive justify-center">
                <AlertCircle className="h-4 w-4" />
                <span>Security validation failed. Please refresh the page.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative flex flex-row items-center justify-center gap-2">
        {waitlistCount.isError ? (
          <>
            <span className="size-2 rounded-full bg-orange-600 dark:bg-orange-400" />
            <span className="absolute left-0 size-2 rounded-full bg-orange-600 blur-xs dark:bg-orange-400" />
            <span className="text-sm text-orange-600 sm:text-base dark:text-orange-400">
              Unable to load waitlist count
            </span>
          </>
        ) : waitlistCount.isLoading ? (
          <>
            <span className="size-2 rounded-full bg-gray-600 dark:bg-gray-400 animate-pulse" />
            <span className="absolute left-0 size-2 rounded-full bg-gray-600 blur-xs dark:bg-gray-400 animate-pulse" />
            <span className="text-sm text-gray-600 sm:text-base dark:text-gray-400">
              Loading waitlist count...
            </span>
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-green-600 dark:bg-green-400" />
            <span className="absolute left-0 size-2 rounded-full bg-green-600 blur-xs dark:bg-green-400" />
            <span className="text-sm text-green-600 sm:text-base dark:text-green-400">
              <NumberFlow value={waitlistCount.count} /> {waitlistCount.count === 1 ? 'person' : 'people'} already joined
            </span>
          </>
        )}
      </div>
    </div>
  );
}
