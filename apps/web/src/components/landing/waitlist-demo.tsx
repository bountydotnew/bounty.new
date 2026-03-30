"use client";

import { authClient } from "@bounty/auth/client";
import { Button } from "@bounty/ui/components/button";
import NumberFlow from "@bounty/ui/components/number-flow";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GithubIcon } from "@bounty/ui/components/icons/huge/github";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useConfetti } from "@/context/confetti-context";
import { trpc, trpcClient } from "@/utils/trpc";
import { MockBrowser } from "./mockup";

function useWaitlistSubmission(onPositionUpdate: (position: number) => void) {
  const { celebrate } = useConfetti();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () => trpcClient.earlyAccess.joinWaitlist.mutate(),
    onSuccess: (data) => {
      if (data.position) {
        onPositionUpdate(data.position);
      }
      celebrate();
      toast.success("You're on the list!");
    },
    onError: (error: unknown) => {
      // Check for tRPC UNAUTHORIZED errors or "Authentication required" message
      const isAuthError =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data &&
        "code" in error.data &&
        error.data.code === "UNAUTHORIZED";

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? (error.message as string)
            : "";

      const isAuthMessage =
        message.includes("Authentication required") ||
        message.includes("Must be logged in") ||
        message.includes("UNAUTHORIZED");

      if (isAuthError || isAuthMessage) {
        authClient.signIn.social({
          provider: "github",
          callbackURL: "/",
        });
        return;
      }

      if (
        message.toLowerCase().includes("too many") ||
        message.toLowerCase().includes("slow down")
      ) {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(message || "Something went wrong. Please try again.");
      }
    },
  });

  return { mutate, isPending, isSuccess };
}

interface WaitlistPageProps {
  compact?: boolean;
}

function WaitlistPage({ compact = false }: WaitlistPageProps) {
  const [position, setPosition] = useState<number | null>(null);

  const waitlistSubmission = useWaitlistSubmission(setPosition);

  // Check if user has already joined the waitlist
  const myEntryQuery = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    retry: false,
  });

  // User is on waitlist if query succeeded or mutation succeeded
  const isOnWaitlist = myEntryQuery.isSuccess || waitlistSubmission.isSuccess;

  // Use position from query, mutation, or state (in that priority)
  const displayPosition = myEntryQuery.data?.position ?? position;

  function joinWaitlist() {
    waitlistSubmission.mutate();
  }

  const isFormDisabled = waitlistSubmission.isPending;

  const waitlistCountQuery = useQuery({
    ...trpc.earlyAccess.getWaitlistCount.queryOptions(),
    retry: 2,
    retryDelay: 1000,
  });
  const waitlistCount = waitlistCountQuery.data?.count ?? 0;

  return (
    <div className="h-full bg-background overflow-auto">
      <div
        className={`flex flex-col items-center justify-center h-full ${compact ? "px-3 py-4" : "px-6 py-10"}`}
      >
        <div className={`w-full ${compact ? "max-w-xs" : "max-w-sm"}`}>
          {/* Header */}
          <div className={`text-left ${compact ? "mb-4" : "mb-8"}`}>
            <h1
              className={`${compact ? "text-lg" : "text-2xl"} font-medium text-foreground tracking-tight ${compact ? "mb-1" : "mb-2"}`}
            >
              Get early access
            </h1>
            <p
              className={`${compact ? "text-xs" : "text-sm"} text-text-muted leading-relaxed`}
            >
              {compact
                ? "Join the waitlist to get started."
                : "Join the waitlist to start creating bounties and getting paid to build."}
            </p>
          </div>

          {/* Success state */}
          {isOnWaitlist ? (
            <div className={`text-left ${compact ? "py-2" : "py-4"}`}>
              <div
                className={`inline-flex items-center justify-center ${compact ? "w-8 h-8 mb-2" : "w-12 h-12 mb-4"} rounded-full bg-brand-accent/10`}
              >
                <svg
                  className={`${compact ? "w-4 h-4" : "w-6 h-6"} text-brand-accent`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2
                className={`${compact ? "text-base" : "text-xl"} font-medium text-foreground mb-1`}
              >
                You're on the list
              </h2>
              <p
                className={`${compact ? "text-xs mb-3" : "text-sm mb-6"} text-text-muted`}
              >
                We'll reach out when it's your turn.
              </p>
              <div
                className={`inline-flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-full bg-surface-1 border border-border-subtle`}
              >
                <span className="text-xs text-text-muted">Position</span>
                <span
                  className={`${compact ? "text-xs" : "text-sm"} font-medium text-brand-accent-muted`}
                >
                  #{displayPosition ?? waitlistCount}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Join button */}
              <div className={compact ? "mb-3" : "mb-6"}>
                <Button
                  className={`text-background hover:opacity-90 font-medium ${compact ? "text-xs w-full" : "w-full"}`}
                  disabled={isFormDisabled}
                  style={{
                    background: "var(--foreground)",
                    borderRadius: compact ? "10px" : "14px",
                    padding: compact ? "8px 12px" : "12px 20px",
                    height: compact ? "36px" : "44px",
                  }}
                  onClick={joinWaitlist}
                  type="button"
                >
                  {waitlistSubmission.isPending ? (
                    "Joining..."
                  ) : (
                    <>
                      <GithubIcon
                        className={`${compact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1"} text-background`}
                      />{" "}
                      {compact ? "Join" : "Join Waitlist"}
                    </>
                  )}
                </Button>
              </div>

              {/* Social proof */}
              <div
                className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}
              >
                <div className="-space-x-2 flex">
                  <div
                    className={`${compact ? "w-5 h-5" : "w-7 h-7"} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/nizzy.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                  <div
                    className={`${compact ? "w-5 h-5" : "w-7 h-7"} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/brandon.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                  <div
                    className={`${compact ? "w-5 h-5" : "w-7 h-7"} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/adam.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                  <div
                    className={`${compact ? "w-5 h-5" : "w-7 h-7"} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/ryan.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                </div>
                <span
                  className={`${compact ? "text-[10px]" : "text-xs"} text-text-muted`}
                >
                  <NumberFlow value={waitlistCount} />+ on the list
                </span>
              </div>
            </>
          )}

          {/* Footer note */}
          <p
            className={`${compact ? "text-[10px] mt-4" : "text-xs mt-8"} text-text-muted`}
          >
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

interface WaitlistDemoProps {
  compact?: boolean;
}

export function WaitlistDemo({ compact = false }: WaitlistDemoProps) {
  return (
    <MockBrowser
      initialUrl="bounty.new/waitlist"
      headlights
      compact={compact}
      className={compact ? "h-[340px]" : undefined}
    >
      <MockBrowser.Toolbar />
      <div className="flex-1 relative overflow-hidden">
        <MockBrowser.Page url="bounty.new/waitlist">
          <WaitlistPage compact={compact} />
        </MockBrowser.Page>
      </div>
    </MockBrowser>
  );
}
