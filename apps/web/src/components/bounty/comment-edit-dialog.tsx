"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  maxChars?: number;
  onSave: (value: string) => void;
  isSaving?: boolean;
}

export default function CommentEditDialog({ open, onOpenChange, initialValue, maxChars = 245, onSave, isSaving }: CommentEditDialogProps) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const remaining = useMemo(() => maxChars - value.length, [maxChars, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background w-full max-w-[500px] rounded-xl border p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight">Edit comment</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= maxChars) setValue(v);
            }}
            placeholder="Update your comment"
            className={`w-full min-h-24 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? "border-red-700" : "border-neutral-800"}`}
          />
          <div className="mt-1 flex items-center justify-end text-[11px]">
            <span className={`${remaining < 0 ? "text-red-500" : "text-neutral-500"}`}>{remaining}</span>
          </div>
        </div>
        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-md"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const trimmed = value.trim();
              if (!trimmed || trimmed.length > maxChars) return;
              onSave(trimmed);
            }}
            className="rounded-md"
            disabled={isSaving || value.trim().length === 0}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


