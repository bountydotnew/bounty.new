/**
 * BountyCommentForm Component
 *
 * Refactored to use Vercel composition patterns:
 * - Compound components with shared context
 * - Explicit components instead of props
 * - State/actions/meta context interface
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
 *
 * @module
 */

// Re-export everything from the index file
export { CommentForm, LegacyBountyCommentForm as default } from './comment-form/index';
export type {
  CommentFormContextValue,
  CommentFormState,
  CommentFormActions,
  CommentFormMeta,
  CommentFormContextValueExtended,
} from './comment-form/index';
