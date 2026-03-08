'use client';

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useFeedback } from './context';

/**
 * Wraps any child element and opens the feedback modal on click.
 * Use this when you want your own button/link/icon to trigger feedback
 * instead of the default floating FeedbackButton.
 *
 * @example
 * ```tsx
 * // In a sidebar menu
 * <FeedbackTrigger>
 *   <button className="sidebar-item">
 *     <MessageIcon /> Send Feedback
 *   </button>
 * </FeedbackTrigger>
 *
 * // With a dropdown item
 * <FeedbackTrigger>
 *   <DropdownMenuItem>Report Issue</DropdownMenuItem>
 * </FeedbackTrigger>
 * ```
 */
export function FeedbackTrigger({ children }: { children: ReactNode }) {
  const { open } = useFeedback();

  if (!isValidElement(children)) {
    return <button type="button" onClick={open}>{children}</button>;
  }

  const child = children as ReactElement<{
    onClick?: (...args: unknown[]) => void;
  }>;

  return cloneElement(child, {
    onClick: (...args: unknown[]) => {
      child.props.onClick?.(...args);
      open();
    },
  });
}
