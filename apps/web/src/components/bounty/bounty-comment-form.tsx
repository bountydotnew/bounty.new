"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, HotkeyButton } from "@/components/ui/button";

interface BountyCommentFormProps {
  maxChars?: number;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
  errorKey?: number;
}

export default function BountyCommentForm({ maxChars = 245, onSubmit, isSubmitting, error, errorKey }: BountyCommentFormProps) {
  const [value, setValue] = useState("");
  const remaining = useMemo(() => maxChars - value.length, [maxChars, value]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!error) return;
    setShake(false);
    const id = requestAnimationFrame(() => {
      setShake(true);
      const t = setTimeout(() => setShake(false), 260);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(id);
  }, [error, errorKey]);
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
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !(e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          const content = value.trim();
          if (!content || content.length > maxChars) return;
          onSubmit(content);
          setValue("");
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          const content = value.trim();
          if (!content || content.length > maxChars) return;
          onSubmit(content);
          setValue("");
        }
      }}
    >
      <div className={shake ? "wiggle" : undefined}>
        <textarea
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length <= maxChars) setValue(v);
          }}
          placeholder="Add a comment"
          className={`w-full min-h-20 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? "border-red-700" : "border-neutral-800"}`}
        />
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className={`truncate ${error ? "text-red-500" : "text-transparent"}`}>{error || " "}</span>
          <span className={`${remaining < 0 ? "text-red-500" : "text-neutral-500"}`}>{remaining}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <HotkeyButton hotkey={"⌘ Enter"} size="sm" disabled={isSubmitting || value.trim().length === 0}>Post</HotkeyButton>
      </div>
      <style jsx>{`
        @keyframes wiggle { 0%{transform:translateX(0)} 25%{transform:translateX(-4px)} 50%{transform:translateX(4px)} 75%{transform:translateX(-2px)} 100%{transform:translateX(0)} }
        .wiggle { animation: wiggle 220ms ease-out; }
      `}</style>
    </form>
  );
}
