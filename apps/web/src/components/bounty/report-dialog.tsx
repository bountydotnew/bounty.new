'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { Textarea } from '@bounty/ui/components/textarea';
import { Label } from '@bounty/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@bounty/ui/components/radio-group';
import { Flag } from 'lucide-react';

type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unsolicited or repetitive content',
  },
  {
    value: 'scam',
    label: 'Scam',
    description: 'Fraudulent or deceptive bounty',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Targeting or bullying someone',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate',
    description: 'Violates community guidelines',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else',
  },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: ReportReason, description?: string) => void;
  isSubmitting?: boolean;
  contentType?: 'bounty' | 'comment' | 'submission' | 'user';
}

export function ReportDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  contentType = 'bounty',
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit(reason, description.trim() || undefined);
    // Reset form
    setReason('spam');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            Report {contentType}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Select a reason for reporting this {contentType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-4">
          <RadioGroup
            value={reason}
            onValueChange={(value) => setReason(value as ReportReason)}
            className="space-y-0"
          >
            {REPORT_REASONS.map((r) => (
              <div
                key={r.value}
                className="flex items-start space-x-3 rounded-lg border border-border-subtle p-3 hover:bg-surface-hover cursor-pointer"
                onClick={() => setReason(r.value)}
              >
                <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                <Label htmlFor={r.value} className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">{r.label}</div>
                  <div className="text-sm text-text-secondary">{r.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why you're reporting this..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
