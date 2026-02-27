'use client';

import { Button } from '@bounty/ui/components/button';
import { Checkbox } from '@bounty/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import Image from 'next/image';
import { useState } from 'react';

type DevWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOkay: (dontShowAgain: boolean) => void;
  onContinue: (dontShowAgain: boolean) => void;
};

export function DevWarningDialog({
  open,
  onOpenChange,
  onOkay,
  onContinue,
}: DevWarningDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md border border-border-default/40 bg-surface-1/95 text-foreground shadow-xl backdrop-blur-md sm:rounded-xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border-default bg-surface-2">
            <Image
              alt="Bounty.new"
              height={32}
              src="/logo-black.png"
              width={32}
            />
          </div>
          <DialogTitle className="font-semibold text-lg tracking-tight">
            Early preview
          </DialogTitle>
          <DialogDescription className="text-foreground/60">
            This build is unfinished. Features may be missing or unstable.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-5 px-1 md:space-y-6">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={dontShowAgain}
              className="border-border-default data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              id="dev-hide"
              onCheckedChange={(v) => setDontShowAgain(Boolean(v))}
            />
            <label
              className="cursor-pointer text-text-secondary text-sm"
              htmlFor="dev-hide"
            >
              Don&apos;t show this again
            </label>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 border-border-default bg-surface-2 text-foreground hover:bg-surface-hover"
              onClick={() => onOkay(dontShowAgain)}
              variant="outline"
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onContinue(dontShowAgain)}
            >
              Proceed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
