'use client';

import { FeedbackForm, useFeedback } from '@bounty/feedback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@bounty/ui/components/dialog';

export function FeedbackDialog() {
  const { isOpen, close, config } = useFeedback();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.ui?.title ?? 'Send Feedback'}</DialogTitle>
          <DialogDescription>
            {config.ui?.description ?? 'Help us improve by describing what went wrong.'}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <FeedbackForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
