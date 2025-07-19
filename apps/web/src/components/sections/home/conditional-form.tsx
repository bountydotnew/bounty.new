"use client";

import { WaitlistForm } from "./waitlist-form";
import { BountyDraftForm } from "./bounty-draft-form";
import { useSearchParams } from "next/navigation";

interface ConditionalFormProps {
  className?: string;
}

export function ConditionalForm({ className }: ConditionalFormProps) {
  const searchParams = useSearchParams();
  const isDevelopment = process.env.NODE_ENV === "production" || searchParams.get("dev") === "true";

  return isDevelopment ? (
    <BountyDraftForm className={className} />
  ) : (
    <WaitlistForm className={className} />
  );
} 