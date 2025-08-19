"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
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
import Image from "next/image";

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
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
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
    mutationFn: async ({
      email,
      fingerprintData,
    }: {
      email: string;
      fingerprintData: thumbmarkResponse;
    }) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, fingerprintData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
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
        email: btoa(variables.email).substring(0, 16),
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
      console.error("Waitlist submission error:", error);

      if (error.message.includes("Rate limit exceeded")) {
        toast.error(
          "You've reached the limit of 3 attempts per hour. Please try again later.",
        );
      } else if (error.message.includes("Invalid device fingerprint")) {
        toast.error(
          "Security validation failed. Please refresh the page and try again.",
        );
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
    isError: query.isError,
  };
}

interface WaitlistFormProps {
  className?: string;
}

export function WaitlistForm({ className }: WaitlistFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const [fingerprintData, setFingerprintData] =
    useState<thumbmarkResponse | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(true);
  const [, setFingerprintError] = useState<string | null>(null);

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
        setFingerprintError(
          "Unable to generate device fingerprint. Please refresh and try again.",
        );
        toast.error(
          "Device fingerprinting failed. Please refresh the page and try again.",
        );
      } finally {
        setFingerprintLoading(false);
      }
    };

    generateFingerprint();
  }, []);

  async function joinWaitlist({ email }: FormSchema) {
    if (!fingerprintData) {
      toast.error(
        "Device fingerprint not ready. Please wait a moment and try again.",
      );
      return;
    }

    waitlistSubmission.mutate({ email, fingerprintData });
  }

  const isFormDisabled =
    waitlistSubmission.isPending || fingerprintLoading || !fingerprintData;

  return (
    <div
      className={cn(
        "max-w-4xl",
        className,
      )}
    >
      {waitlistSubmission.success ? (
        <div className="flex flex-col gap-4">
          <p className="text-xl font-semibold font-display-book" style={{ color: "rgba(239, 239, 239, 1)" }}>
            You&apos;re on the waitlist!
          </p>
          <p className="text-base font-display-book max-w-2xl leading-relaxed mb-4" style={{ color: "rgba(146, 146, 146, 1)" }}>
            We&apos;ll let you know when we&apos;re ready to show you what
            we&apos;ve been working on.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          <form
            className="flex gap-3 mb-8 max-w-md"
            onSubmit={handleSubmit(joinWaitlist)}
          >
            <div className="flex-1">
              <Input
                type="email"
                placeholder="grim@0.email"
                className="flex-1 border-0 text-white placeholder:text-gray-400 font-display-book"
                style={{
                  background: "rgba(40, 40, 40, 1)",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  height: "44px",
                }}
                {...register("email")}
                disabled={isFormDisabled}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive font-display-book">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button
              className="text-black hover:bg-gray-100 font-display-book"
              style={{
                background: "rgba(255, 255, 255, 1)",
                borderRadius: "14px",
                padding: "12px 16px",
                height: "44px",
                width: "122px",
              }}
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


        </div>
      )}

      <div className="flex items-center gap-3 mb-20">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full overflow-hidden border-2 border-black font-display-book">
            <Image src="/nizzy.jpg" alt="waitlist" width={32} height={32} />
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full overflow-hidden border-2 border-black font-display-book">
            <Image src="/brandon.jpg" alt="waitlist" width={32} height={32} />
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full overflow-hidden border-2 border-black font-display-book">
            <Image src="/adam.jpg" alt="waitlist" width={32} height={32} />
          </div>
          <div className="w-8 h-8 bg-green-500 rounded-full overflow-hidden border-2 border-black font-display-book">
            <Image src="/ryan.jpg" alt="waitlist" width={32} height={32} />
          </div>
        </div>
        {waitlistCount.isError ? (
          <span className="text-orange-400 font-medium font-display-book">
            Unable to load waitlist count
          </span>
        ) : waitlistCount.isLoading ? (
          <span className="text-gray-400 font-medium font-display-book">
            Loading waitlist count...
          </span>
        ) : (
          <span className="text-green-400 font-medium font-display-book">
            <NumberFlow value={waitlistCount.count} />+ people already joined
          </span>
        )}
      </div>
    </div>
  );
}
