'use client';

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
