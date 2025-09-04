"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, HotkeyButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
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
  disabled?: boolean;
}

type FormData = {
  content: string;
};

// Custom hook for character counting with cursor tracking
function useCharacterCount(content: string, maxChars: number) {
  return useMemo(() => {
    const remaining = maxChars - content.length;
    const isOverLimit = remaining < 0;
    const isNearLimit = remaining <= Math.min(50, maxChars * 0.2);
    
    return {
      remaining,
      isOverLimit,
      isNearLimit,
      progress: Math.min((content.length / maxChars) * 100, 100),
    };
  }, [content, maxChars]);
}


// Custom hook for form logic
function useCommentForm({ 
  maxChars, 
  onSubmit, 
  onCancel 
}: {
  maxChars: number;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
}) {
  const schema = useMemo(() => 
    z.object({
      content: z
        .string()
        .min(1, "Comment cannot be empty")
        .max(maxChars, `Comment cannot exceed ${maxChars} characters`),
    }), [maxChars]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
    mode: "onChange",
  });

  const handleFormSubmit = useCallback((data: FormData) => {
    const trimmedContent = data.content.trim();
    if (!trimmedContent) return;
    
    onSubmit(trimmedContent);
    form.reset();
  }, [onSubmit, form]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Escape key
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
      return;
    }

    // Handle Enter key (both regular and Cmd/Ctrl+Enter)
    if (e.key === "Enter") {
      const isCommandEnter = e.metaKey || e.ctrlKey;
      const isPlainEnter = !e.shiftKey && !isCommandEnter;
      
      if (isCommandEnter || isPlainEnter) {
        e.preventDefault();
        form.handleSubmit(handleFormSubmit)();
      }
    }
  }, [onCancel, form, handleFormSubmit]);

  return {
    form,
    handleFormSubmit,
    handleKeyDown,
  };
}

export default function BountyCommentForm({
  maxChars = 245,
  onSubmit,
  isSubmitting = false,
  error,
  errorKey,
  placeholder = "Add a comment",
  submitLabel = "Post",
  onCancel,
  autoFocus = false,
  disabled = false,
}: BountyCommentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  const { form, handleFormSubmit, handleKeyDown } = useCommentForm({
    maxChars,
    onSubmit,
    onCancel,
  });


  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;
  const content = watch("content");
  const { remaining, isOverLimit, isNearLimit } = useCharacterCount(content, maxChars);

  // Combine refs and event handlers
  const { ref: formRef, onChange, ...fieldProps } = register("content");
  const combinedRef = useCallback((el: HTMLTextAreaElement | null) => {
    formRef(el);
    textareaRef.current = el;
  }, [formRef]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
  }, [onChange]);

  // Determine if form can be submitted
  const canSubmit = !isSubmitting && !disabled && isValid && content.trim().length > 0 && !isOverLimit;

  // Error message with priority: prop error > form errors
  const errorMessage = error || (errors.content?.message as string);
  const hasError = Boolean(errorMessage);


  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      onKeyDown={handleKeyDown}
      className="space-y-3"
      noValidate
    >
      {/* Textarea Container with Cursor Counter Overlay */}
      <div className="relative">
        <textarea
          {...fieldProps}
          ref={combinedRef}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isSubmitting || disabled}
          autoFocus={autoFocus}
          className={cn(
            "w-full min-h-16 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200",
            "placeholder:text-neutral-500 resize-none",
            "focus:outline-none focus:ring-1 focus:ring-neutral-700 focus:border-neutral-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            isOverLimit ? "border-red-700 focus:ring-red-700" : "border-neutral-800"
          )}
          aria-describedby={hasError ? "comment-error" : "comment-counter"}
          aria-invalid={hasError}
        />

        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none">
          {isNearLimit && (
            <div className={cn(
              "h-2 w-2 rounded-full",
              isOverLimit ? "bg-red-500" : "bg-yellow-500"
            )} />
          )}
          <span
            id="comment-counter"
            className={cn(
              "text-xs tabular-nums opacity-60",
              isOverLimit 
                ? "text-red-400" 
                : isNearLimit 
                  ? "text-yellow-400" 
                  : "text-neutral-500"
            )}
            aria-live="polite"
          >
            {remaining}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div
          id="comment-error"
          key={errorKey} // Force re-render when errorKey changes
          className="text-xs text-red-400"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || disabled}
            className="border-neutral-700 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700/40"
          >
            Cancel
          </Button>
        )}
        <HotkeyButton
          type="submit"
          hotkey="⏎"
          size="sm"
          disabled={!canSubmit}
          className={cn(
            isSubmitting && "opacity-75 cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Posting..." : submitLabel}
        </HotkeyButton>
      </div>
    </form>
  );
}