"use client";

import { Suspense } from "react";
import { WaitlistForm } from "./waitlist-form";
// import { BountyDraftForm } from "./bounty-draft-form";
// import { useSearchParams } from "next/navigation";

interface ConditionalFormProps {
  className?: string;
}

function ConditionalFormContent({ className }: ConditionalFormProps) {
  // const searchParams = useSearchParams();
  // const isDevelopment = process.env.NODE_ENV === "development" || searchParams.get("dev") === "true";

  // return isDevelopment ? (
  //   <BountyDraftForm className={className} />
  // ) : (
  //   <WaitlistForm className={className} />
  // );
  return (
    <WaitlistForm className={className} />
  );
}

export function ConditionalForm({ className }: ConditionalFormProps) {
  return (
    <Suspense fallback={<WaitlistForm className={className} />}>
      <ConditionalFormContent className={className} />
    </Suspense>
  );
} 