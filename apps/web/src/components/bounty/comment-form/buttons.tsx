'use client';

import { useContext } from 'react';
import { Button, HotkeyButton } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';
import { CommentFormContext } from './context';
import type { CommentFormContextValueExtended } from './provider';

/**
 * CommentForm Buttons
 *
 * Compound component that displays the submit and cancel buttons.
 * Must be used within CommentFormProvider.
 *
 * @example
 * ```tsx
 * <CommentFormProvider {...props}>
 *   <CommentForm.Textarea />
 *   <CommentForm.Buttons />
 * </CommentFormProvider>
 * ```
 */
export function Buttons() {
  const context = useContext(CommentFormContext) as CommentFormContextValueExtended | null;
  if (!context) {
    throw new Error('Buttons must be used within CommentFormProvider');
  }

  const { state, actions, meta } = context;
  const { isEmpty, isOverLimit, isValid } = state;
  const { cancel } = actions;
  const { disabled, isSubmitting = false, submitLabel } = meta;

  // Determine if form can be submitted
  const canSubmit =
    !(isSubmitting || disabled) &&
    isValid &&
    !isEmpty &&
    !isOverLimit;

  // Show cancel button only if cancel action is provided
  const showCancel = !!cancel;

  return (
    <div className="flex justify-end gap-2">
      {showCancel && (
        <Button
          className="border-neutral-700 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700/40"
          disabled={isSubmitting || disabled}
          onClick={cancel}
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
  );
}
