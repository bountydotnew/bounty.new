'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@bounty/ui/components/button';
import { Checkbox } from '@bounty/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';

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
      <DialogContent
        className="max-w-md border border-[#383838]/40 bg-[#111214]/95 text-white shadow-xl backdrop-blur-md sm:rounded-xl"
        showOverlay
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
            <Image
              alt="Bounty.new"
              height={32}
              src="/bdn-b-w-trans.png"
              width={32}
            />
          </div>
          <DialogTitle className="font-semibold text-lg tracking-tight">
            Early preview
          </DialogTitle>
          <DialogDescription className="text-white/60">
            This build is unfinished. Features may be missing or unstable.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-5 px-1 md:space-y-6">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={dontShowAgain}
              className="border-neutral-700 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              id="dev-hide"
              onCheckedChange={(v) => setDontShowAgain(Boolean(v))}
            />
            <label
              className="cursor-pointer text-neutral-300 text-sm"
              htmlFor="dev-hide"
            >
              Don&apos;t show this again
            </label>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 border-neutral-700 bg-white/5 text-white hover:bg-white/10"
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
