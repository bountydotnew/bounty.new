'use client';

import { useContext, useCallback } from 'react';
import { cn } from '@bounty/ui/lib/utils';
import { CommentFormContext } from './context';
import type { CommentFormContextValueExtended } from './provider';

/**
 * CommentForm Textarea
 *
 * Compound component that displays the textarea input with character counter.
 * Must be used within CommentFormProvider.
 *
 * @example
 * ```tsx
 * <CommentFormProvider {...props}>
 *   <CommentForm.Textarea />
 * </CommentFormProvider>
 * ```
 */
export function Textarea() {
  const context = useContext(CommentFormContext) as CommentFormContextValueExtended | null;
  if (!context) {
    throw new Error('Textarea must be used within CommentFormProvider');
  }

  const { state, meta, form } = context;
  const { remaining, isOverLimit, isNearLimit } = state;
  const {
    placeholder,
    autoFocus,
    disabled,
    textareaRef,
    error,
  } = meta;

  const { register, formState } = form;
  const { ref: formRef, onChange, ...fieldProps } = register('content');

  // Combine refs and event handlers
  const combinedRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      formRef(el);
      if (textareaRef && textareaRef.current !== el) {
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }
    },
    [formRef, textareaRef]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e);
    },
    [onChange]
  );

  // Determine error message with priority: prop error > form errors
  const errorMessage = error || (formState.errors.content?.message as string);
  const hasError = Boolean(errorMessage);

  return (
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
        disabled={disabled}
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
  );
}
