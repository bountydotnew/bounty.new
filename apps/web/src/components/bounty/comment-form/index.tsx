'use client';

import { memo } from 'react';
import { CommentFormProvider } from './provider';
import { Textarea } from './textarea';
import { Error } from './error';
import { Buttons } from './buttons';

/**
 * CommentForm Compound Component
 *
 * Provides a flexible, composable API for comment input forms.
 * Following Vercel composition patterns with explicit components.
 *
 * @example
 * ```tsx
 * // New API with compound components
 * import { CommentForm } from '@/components/bounty/comment-form';
 *
 * <CommentForm.Provider
 *   onSubmit={(content) => console.log(content)}
 *   maxChars={245}
 * >
 *   <CommentForm.Textarea />
 *   <CommentForm.Error />
 *   <CommentForm.Buttons />
 * </CommentForm.Provider>
 * ```
 */
export const CommentForm = {
  /**
   * Provider component that wraps the form with state and actions
   */
  Provider: CommentFormProvider,

  /**
   * Textarea input with character counter
   */
  Textarea,

  /**
   * Error message display
   */
  Error,

  /**
   * Submit and cancel buttons
   */
  Buttons,
};

// Re-export types
export type {
  CommentFormContextValue,
  CommentFormState,
  CommentFormActions,
  CommentFormMeta,
} from './context';
export type { CommentFormContextValueExtended } from './provider';

/**
 * Backward-compatible BountyCommentForm component
 *
 * Maintains the old API for gradual migration.
 * Use the new compound component API for new code.
 *
 * @deprecated Use CommentForm.Provider with individual components instead
 */
interface LegacyBountyCommentFormProps {
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

export const LegacyBountyCommentForm = memo(function LegacyBountyCommentForm({
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
}: LegacyBountyCommentFormProps) {
  return (
    <CommentFormProvider
      error={error}
      errorKey={errorKey}
      isSubmitting={isSubmitting}
      maxChars={maxChars}
      onCancel={onCancel}
      onSubmit={onSubmit}
      placeholder={placeholder}
      submitLabel={submitLabel}
      autoFocus={autoFocus}
      disabled={disabled}
    >
      <form
        className="space-y-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Textarea />
        <Error />
        <Buttons />
      </form>
    </CommentFormProvider>
  );
});
