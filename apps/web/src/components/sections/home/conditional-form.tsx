"use client";

import { WaitlistForm } from "./waitlist-form";
import { BountyDraftForm } from "./bounty-draft-form";

interface ConditionalFormProps {
  className?: string;
}

export function ConditionalForm({ className }: ConditionalFormProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return isDevelopment ? (
    <BountyDraftForm className={className} />
  ) : (
    <WaitlistForm className={className} />
  );
} 