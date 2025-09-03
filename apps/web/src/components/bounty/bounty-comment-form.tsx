"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { containsBadWord } from "@/lib/bad-words";
import { Button, HotkeyButton } from "@/components/ui/button";

interface BountyCommentFormProps {
  maxChars?: number;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
  errorKey?: number;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export default function BountyCommentForm({ maxChars = 245, onSubmit, isSubmitting, error, errorKey, placeholder, submitLabel, onCancel, autoFocus }: BountyCommentFormProps) {
  const schema = z.object({
    content: z
      .string()
      .min(1, "Required")
      .max(maxChars, `Max ${maxChars} characters`),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{ content: string }>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });
  const value = watch("content");
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
      onSubmit={handleSubmit(({ content }) => {
        const c = content.trim();
        if (!c) return;
        onSubmit(c);
        reset();
      })}
      className="space-y-2"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !(e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          const content = value.trim();
          if (!content || content.length > maxChars) return;
          onSubmit(content);
          setValue("content", "");
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          const content = value.trim();
          if (!content || content.length > maxChars) return;
          onSubmit(content);
          setValue("content", "");
        }
      }}
    >
      <div className={shake ? "wiggle" : undefined}>
        <textarea
          {...register("content")}
          placeholder={placeholder ?? "Add a comment"}
          className={`w-full min-h-20 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? "border-red-700" : "border-neutral-800"}`}
          autoFocus={autoFocus}
        />
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className={`truncate ${error || errors.content ? "text-red-500" : "text-transparent"}`}>{(errors.content?.message as string) || error || " "}</span>
          <span className={`${remaining < 0 ? "text-red-500" : "text-neutral-500"}`}>{remaining}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        )}
        <HotkeyButton hotkey={"⏎"} size="sm" disabled={isSubmitting || value.trim().length === 0}>{submitLabel ?? "Post"}</HotkeyButton>
      </div>
      <style jsx>{`
        @keyframes wiggle { 0%{transform:translateX(0)} 25%{transform:translateX(-4px)} 50%{transform:translateX(4px)} 75%{transform:translateX(-2px)} 100%{transform:translateX(0)} }
        .wiggle { animation: wiggle 220ms ease-out; }
      `}</style>
    </form>
  );
}
