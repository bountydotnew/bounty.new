'use client';

import { useMemo, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CommentFormContext,
  type CommentFormState,
  type CommentFormActions,
  type CommentFormMeta,
} from './context';
import type { UseFormReturn } from 'react-hook-form';

type FormData = {
  content: string;
};

interface CommentFormProviderProps {
  children: ReactNode;
  /** Maximum character count */
  maxChars?: number;
  /** Submit callback */
  onSubmit: (content: string) => void;
  /** Cancel callback */
  onCancel?: () => void;
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
 * Custom hook for character counting
 */
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

/**
 * Extended context value that includes form methods
 */
export interface CommentFormContextValueExtended {
  state: CommentFormState;
  actions: CommentFormActions;
  meta: CommentFormMeta & {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  };
  form: UseFormReturn<FormData>;
}

/**
 * CommentForm Provider
 *
 * Wraps the form with state and actions following Vercel composition patterns.
 * The provider is the ONLY place that knows how state is managed.
 * Child components only depend on the context interface.
 *
 * @example
 * ```tsx
 * <CommentFormProvider
 *   onSubmit={(content) => console.log(content)}
 *   maxChars={245}
 * >
 *   <CommentForm.Textarea />
 *   <CommentForm.SubmitButton />
 * </CommentFormProvider>
 * ```
 */
export function CommentFormProvider({
  children,
  maxChars = 245,
  onSubmit,
  onCancel,
  placeholder = 'Add a comment',
  submitLabel = 'Post',
  autoFocus = false,
  disabled = false,
  error = null,
  errorKey,
  isSubmitting = false,
}: CommentFormProviderProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Create schema based on maxChars
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

  const { watch, formState, reset } = form;
  const content = watch('content');
  const { isValid } = formState;

  const {
    remaining,
    isOverLimit,
    isNearLimit,
  } = useCharacterCount(content, maxChars);

  // Focus textarea on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Handle submit
  const submit = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isOverLimit) {
      return;
    }
    onSubmit(trimmedContent);
    reset();
  }, [content, isOverLimit, onSubmit, reset]);

  // Update content action
  const updateContent = useCallback((newContent: string) => {
    form.setValue('content', newContent, { shouldValidate: true });
  }, [form]);

  // Cancel action
  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // State object
  const state: CommentFormState = useMemo(
    () => ({
      content,
      remaining,
      isOverLimit,
      isNearLimit,
      progress: Math.min((content.length / maxChars) * 100, 100),
      isValid,
      isEmpty: content.trim().length === 0,
    }),
    [content, remaining, isOverLimit, isNearLimit, maxChars, isValid]
  );

  // Actions object
  const actions: CommentFormActions = useMemo(
    () => ({
      updateContent,
      submit,
      cancel,
    }),
    [updateContent, submit, cancel]
  );

  // Meta object
  const meta: CommentFormMeta & {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  } = useMemo(
    () => ({
      maxChars,
      placeholder,
      submitLabel,
      autoFocus,
      disabled,
      error,
      errorKey,
      textareaRef,
      isSubmitting,
    }),
    [maxChars, placeholder, submitLabel, autoFocus, disabled, error, errorKey, textareaRef, isSubmitting]
  );

  const contextValue: CommentFormContextValueExtended = useMemo(
    () => ({
      state,
      actions,
      meta,
      form,
    }),
    [state, actions, meta, form]
  );

  return (
    <CommentFormContext.Provider value={contextValue as any}>
      {children}
    </CommentFormContext.Provider>
  );
}
