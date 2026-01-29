import { createContext } from 'react';

/**
 * CommentForm State Interface
 * Contains all data needed by child components
 */
export interface CommentFormState {
  /** Current content value */
  content: string;
  /** Remaining character count */
  remaining: number;
  /** Whether over the character limit */
  isOverLimit: boolean;
  /** Whether near the character limit */
  isNearLimit: boolean;
  /** Progress percentage */
  progress: number;
  /** Whether form is valid */
  isValid: boolean;
  /** Whether content is empty after trim */
  isEmpty: boolean;
}

/**
 * CommentForm Actions Interface
 * Contains all actions that can be performed
 */
export interface CommentFormActions {
  /** Update the content */
  updateContent: (content: string) => void;
  /** Submit the form */
  submit: () => void;
  /** Cancel the form */
  cancel: () => void;
}

/**
 * CommentForm Meta Interface
 * Contains metadata and configuration
 */
export interface CommentFormMeta {
  /** Maximum character count */
  maxChars: number;
  /** Placeholder text */
  placeholder?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Whether to auto-focus */
  autoFocus?: boolean;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string | null;
  /** Error key for forcing re-renders */
  errorKey?: number;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

/**
 * Combined context value interface
 * Following Vercel composition patterns: state/actions/meta structure
 */
export interface CommentFormContextValue {
  state: CommentFormState;
  actions: CommentFormActions;
  meta: CommentFormMeta;
}

/**
 * Context for CommentForm compound components
 * Null means we're outside the provider
 */
export const CommentFormContext = createContext<CommentFormContextValue | null>(null);
