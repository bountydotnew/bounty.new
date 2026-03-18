'use client';

import { useRef } from 'react';
import { useFeedback } from './context';
import { FeedbackForm } from './form';

/**
 * Built-in dialog wrapper around FeedbackForm.
 * Use this if you don't have your own dialog component.
 *
 * If you have your own dialog (e.g. shadcn/ui, Radix, Headless UI),
 * use `<FeedbackForm />` directly inside it instead:
 *
 * @example
 * ```tsx
 * import { Dialog, DialogContent } from '@/components/ui/dialog';
 * import { FeedbackForm, useFeedback } from '@bounty/feedback';
 *
 * function MyFeedback() {
 *   const { isOpen, close } = useFeedback();
 *   return (
 *     <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
 *       <DialogContent>
 *         <DialogHeader>
 *           <DialogTitle>Report an Issue</DialogTitle>
 *         </DialogHeader>
 *         <FeedbackForm />
 *       </DialogContent>
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function FeedbackModal() {
  const { isOpen, close, config } = useFeedback();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalZIndex = config.ui?.zIndex ?? 10_000;

  // Sync dialog open/close state — render-time with ref tracking
  const prevIsOpen = useRef(isOpen);
  if (prevIsOpen.current !== isOpen) {
    prevIsOpen.current = isOpen;
    if (isOpen) {
      queueMicrotask(() => dialogRef.current?.showModal());
    } else {
      queueMicrotask(() => dialogRef.current?.close());
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      data-feedback-ui
      style={{ zIndex: modalZIndex }}
      className="fixed inset-0 m-auto w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl backdrop:bg-black/50"
    >
      <FeedbackForm />
    </dialog>
  );
}
