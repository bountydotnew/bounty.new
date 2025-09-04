"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

type DevWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOkay: (dontShowAgain: boolean) => void;
  onContinue: (dontShowAgain: boolean) => void;
};

export function DevWarningDialog({ open, onOpenChange, onOkay, onContinue }: DevWarningDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showOverlay className="max-w-md border border-[#383838]/40 bg-[#111214]/95 text-white backdrop-blur-md shadow-xl sm:rounded-xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
            <Image src="/bdn-b-w-trans.png" alt="Bounty.new" width={32} height={32} />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight">Early preview</DialogTitle>
          <DialogDescription className="text-white/60">
            This build is unfinished. Features may be missing or unstable.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-5 md:space-y-6 px-1">
          <div className="flex items-center gap-2">
            <Checkbox id="dev-hide" checked={dontShowAgain} onCheckedChange={(v) => setDontShowAgain(Boolean(v))} className="border-neutral-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
            <label htmlFor="dev-hide" className="cursor-pointer text-sm text-neutral-300">Don&apos;t show this again</label>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => onOkay(dontShowAgain)} variant="outline" className="flex-1 border-neutral-700 bg-white/5 text-white hover:bg-white/10">Back</Button>
            <Button onClick={() => onContinue(dontShowAgain)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Proceed</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


