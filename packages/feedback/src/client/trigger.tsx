'use client';

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useFeedback } from './context';

/**
 * Wraps any child element to open the feedback flow on click.
 *
 * By default, opens the element picker overlay first (mode="select").
 * Set mode="direct" to skip selection and open the modal immediately.
 *
 * @example
 * ```tsx
 * // Element picker flow (default) — click → select element → modal
 * <FeedbackTrigger>
 *   <button>Send Feedback</button>
 * </FeedbackTrigger>
 *
 * // Direct modal — click → modal opens immediately
 * <FeedbackTrigger mode="direct">
 *   <button>Quick Feedback</button>
 * </FeedbackTrigger>
 * ```
 */
export function FeedbackTrigger({
  children,
  mode = 'select',
}: {
  children: ReactNode;
  mode?: 'select' | 'direct';
}) {
  const { open, startSelection } = useFeedback();
  const handler = mode === 'direct' ? open : startSelection;

  if (!isValidElement(children)) {
    return (
      <button type="button" onClick={handler}>
        {children}
      </button>
    );
  }

  const child = children as ReactElement<{
    onClick?: (...args: unknown[]) => void;
  }>;

  return cloneElement(child, {
    onClick: (...args: unknown[]) => {
      child.props.onClick?.(...args);
      handler();
    },
  });
}
