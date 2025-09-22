'use client';

import { Button, HotkeyButton } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
  onCancel,
}: {
  maxChars: number;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
}) {
  const schema = useMemo(
    () =>
      z.object({
        content: z
          .string()
          .min(1, 'Comment cannot be empty')
          .max(maxChars, `Comment cannot exceed ${maxChars} characters`),
      }),
    [maxChars]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: '' },
    mode: 'onChange',
  });

  const handleFormSubmit = useCallback(
    (data: FormData) => {
      const trimmedContent = data.content.trim();
      if (!trimmedContent) {
        return;
      }

      onSubmit(trimmedContent);
      form.reset();
    },
    [onSubmit, form]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }

      // Handle Enter key (both regular and Cmd/Ctrl+Enter)
      if (e.key === 'Enter') {
        const isCommandEnter = e.metaKey || e.ctrlKey;
        const isPlainEnter = !(e.shiftKey || isCommandEnter);

        if (isCommandEnter || isPlainEnter) {
          e.preventDefault();
          form.handleSubmit(handleFormSubmit)();
        }
      }
    },
    [onCancel, form, handleFormSubmit]
  );

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
  placeholder = 'Add a comment',
  submitLabel = 'Post',
  onCancel,
  autoFocus = false,
  disabled = false,
}: BountyCommentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { form, handleKeyDown } = useCommentForm({
    maxChars,
    onSubmit,
    onCancel,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form;
  const content = watch('content');
  const { remaining, isOverLimit, isNearLimit } = useCharacterCount(
    content,
    maxChars
  );

  // Combine refs and event handlers
  const { ref: formRef, onChange, ...fieldProps } = register('content');
  const combinedRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      formRef(el);
      textareaRef.current = el;
    },
    [formRef]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e);
    },
    [onChange]
  );

  // Determine if form can be submitted
  const canSubmit =
    !(isSubmitting || disabled) &&
    isValid &&
    content.trim().length > 0 &&
    !isOverLimit;

  // Error message with priority: prop error > form errors
  const errorMessage = error || (errors.content?.message as string);
  const hasError = Boolean(errorMessage);

  const onValidatedSubmit = async (data: FormData) => {
    const trimmed = data.content.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    form.reset();
  };

  return (
    <form
      className="space-y-3"
      noValidate
      onKeyDown={handleKeyDown}
      onSubmit={handleSubmit(onValidatedSubmit)}
    >
      {/* Textarea Container with Cursor Counter Overlay */}
      <div className="relative">
        <textarea
          {...fieldProps}
          aria-describedby={hasError ? 'comment-error' : 'comment-counter'}
          aria-invalid={hasError}
          autoFocus={autoFocus}
          className={cn(
            'min-h-16 w-full rounded-md border bg-neutral-900 p-3 text-neutral-200 text-sm',
            'resize-none placeholder:text-neutral-500',
            'focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-700',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-150',
            isOverLimit
              ? 'border-red-700 focus:ring-red-700'
              : 'border-neutral-800'
          )}
          disabled={isSubmitting || disabled}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={combinedRef}
        />

        {/* Character Counter */}
        <div className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1">
          {isNearLimit && (
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isOverLimit ? 'bg-red-500' : 'bg-yellow-500'
              )}
            />
          )}
          <span
            aria-live="polite"
            className={cn(
              'text-xs tabular-nums opacity-60',
              isOverLimit
                ? 'text-red-400'
                : isNearLimit
                  ? 'text-yellow-400'
                  : 'text-neutral-500'
            )}
            id="comment-counter"
          >
            {remaining}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div
          aria-live="polite"
          className="text-red-400 text-xs" // Force re-render when errorKey changes
          id="comment-error"
          key={errorKey}
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            className="border-neutral-700 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700/40"
            disabled={isSubmitting || disabled}
            onClick={onCancel}
            size="sm"
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        )}
        <HotkeyButton
          className={cn(isSubmitting && 'cursor-not-allowed opacity-75')}
          disabled={!canSubmit}
          hotkey="⏎"
          size="sm"
          type="submit"
        >
          {isSubmitting ? 'Posting...' : submitLabel}
        </HotkeyButton>
      </div>
    </form>
  );
}
