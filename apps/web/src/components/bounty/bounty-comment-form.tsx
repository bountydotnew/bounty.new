"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface BountyCommentFormProps {
  maxChars?: number;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

export default function BountyCommentForm({ maxChars = 245, onSubmit, isSubmitting }: BountyCommentFormProps) {
  const [value, setValue] = useState("");
  const remaining = useMemo(() => maxChars - value.length, [maxChars, value]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const content = value.trim();
        if (!content || content.length > maxChars) return;
        onSubmit(content);
        setValue("");
      }}
      className="space-y-2"
    >
      <div>
        <textarea
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length <= maxChars) setValue(v);
          }}
          placeholder="Add a comment"
          className={`w-full min-h-20 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? "border-red-700" : "border-neutral-800"}`}
        />
        <div className="mt-1 flex items-center justify-end text-[11px]">
          <span className={`${remaining < 0 ? "text-red-500" : "text-neutral-500"}`}>{remaining}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={isSubmitting || value.trim().length === 0}>Post</Button>
      </div>
    </form>
  );
}
