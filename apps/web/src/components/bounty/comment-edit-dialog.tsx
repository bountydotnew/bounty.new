'use client';

import { Button, HotkeyButton } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Sheet, SheetContent } from '@bounty/ui/components/sheet';
import { Textarea } from '@bounty/ui/components/textarea';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { useEffect, useMemo, useState } from 'react';

interface CommentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  maxChars?: number;
  onSave: (value: string) => void;
  isSaving?: boolean;
  error?: string | null;
}

export default function CommentEditDialog({
  open,
  onOpenChange,
  initialValue,
  maxChars = 245,
  onSave,
  isSaving,
  error,
}: CommentEditDialogProps) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  const remaining = useMemo(() => maxChars - value.length, [maxChars, value]);

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent
          className="max-h-[70vh] w-full overflow-y-auto rounded-t-2xl border border-neutral-800 bg-neutral-900 p-4"
          side="bottom"
        >
          <div className="mb-4 font-medium text-neutral-200 text-sm">
            Edit comment
          </div>
          <div className="space-y-2">
            <Textarea
              className={`min-h-20 w-full rounded-md border bg-neutral-900 p-3 text-neutral-200 text-sm placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? 'border-red-700' : 'border-neutral-800'}`}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length <= maxChars) {
                  setValue(v);
                }
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  const trimmed = value.trim();
                  if (!trimmed || trimmed.length > maxChars) {
                    return;
                  }
                  onSave(trimmed);
                }
              }}
              placeholder="Update your comment"
              value={value}
            />
            <div className="mt-1 flex items-center justify-end text-[11px]">
              <span
                className={`${remaining < 0 ? 'text-red-500' : 'text-neutral-500'}`}
              >
                {remaining}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              className="rounded-md"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
            <HotkeyButton
              className="rounded-md"
              disabled={isSaving || value.trim().length === 0}
              hotkey={'⏎'}
              onClick={() => {
                const trimmed = value.trim();
                if (!trimmed || trimmed.length > maxChars) {
                  return;
                }
                onSave(trimmed);
              }}
              size="sm"
            >
              Save
            </HotkeyButton>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-full max-w-[520px] rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <DialogHeader>
          <DialogTitle className="mb-2 font-medium text-neutral-200 text-sm">
            Edit comment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            className={`min-h-20 w-full rounded-md border bg-neutral-900 p-3 text-neutral-200 text-sm placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? 'border-red-700' : 'border-neutral-800'}`}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= maxChars) {
                setValue(v);
              }
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                const trimmed = value.trim();
                if (!trimmed || trimmed.length > maxChars) {
                  return;
                }
                onSave(trimmed);
              }
            }}
            placeholder="Update your comment"
            value={value}
          />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            {error && <span className="text-red-400">{error}</span>}
            <span
              className={`${remaining < 0 ? 'text-red-500' : 'text-neutral-500'}`}
            >
              {remaining}
            </span>
          </div>
        </div>
        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button
            className="rounded-md"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>
          <HotkeyButton
            className="rounded-md"
            disabled={isSaving || value.trim().length === 0}
            hotkey={'⏎'}
            onClick={() => {
              const trimmed = value.trim();
              if (!trimmed || trimmed.length > maxChars) {
                return;
              }
              onSave(trimmed);
            }}
            size="sm"
          >
            Save
          </HotkeyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
