'use client';

import { useContext } from 'react';
import { CommentFormContext } from './context';
import type { CommentFormContextValueExtended } from './provider';

/**
 * CommentForm Error
 *
 * Compound component that displays error messages.
 * Must be used within CommentFormProvider.
 *
 * @example
 * ```tsx
 * <CommentFormProvider {...props}>
 *   <CommentForm.Textarea />
 *   <CommentForm.Error />
 * </CommentFormProvider>
 * ```
 */
export function Error() {
  const context = useContext(CommentFormContext) as CommentFormContextValueExtended | null;
  if (!context) {
    throw new globalThis.Error('Error must be used within CommentFormProvider');
  }

  const { meta, form } = context;
  const { error, errorKey } = meta;

  // Determine error message with priority: prop error > form errors
  const formError = form.formState.errors.content?.message as string | undefined;
  const errorMessage = error || formError;

  // Show error if we have one
  if (!errorMessage) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="text-red-400 text-xs"
      id="comment-error"
      key={errorKey ?? 0}
      role="alert"
    >
      {errorMessage}
    </div>
  );
}
