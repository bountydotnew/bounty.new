"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useNavigationContext } from "@/hooks/use-navigation-context";

export function SmartNavigation() {
  const router = useRouter();
  const context = useNavigationContext();

  const handleBack = () => {
    // Try browser back first if it makes sense
    if (typeof window !== "undefined" && window.history.length > 1) {
      const referrer = document.referrer;
      if (
        referrer &&
        (referrer.includes("/dashboard") ||
          referrer.includes("/bounties") ||
          referrer.includes("/issues/"))
      ) {
        router.back();
        return;
      }
    }

    // Fallback to context-aware navigation
    router.push(context.backPath);
  };

  return (
    <div className="flex items-center justify-between my-6">
      {/* Smart Back Button */}
      <Button
        variant="default"
        size="sm"
        onClick={handleBack}
        className="previewButton flex items-center gap-2 text-[#2C2C2C] border-[rgba(239,239,239,0.2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to {context.backLabel}</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Context indicator for special cases */}
      {/* {context.from === "gh-issue" && context.referrerInfo && (
        <div className="flex items-center gap-2 text-xs text-[rgba(239,239,239,0.5)]">
          <span>from GitHub Issue #{context.referrerInfo.issueNumber}</span>
        </div>
      )}

      {context.from === "dashboard" && (
        <div className="flex items-center gap-2 text-xs text-[rgba(239,239,239,0.5)]">
          <span>from Dashboard</span>
        </div>
      )} */}
    </div>
  );
}
