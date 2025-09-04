"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button, HotkeyButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  maxChars?: number;
  onSave: (value: string) => void;
  isSaving?: boolean;
  error?: string | null;
}

export default function CommentEditDialog({ open, onOpenChange, initialValue, maxChars = 245, onSave, isSaving, error }: CommentEditDialogProps) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const remaining = useMemo(() => maxChars - value.length, [maxChars, value]);

  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="w-full max-h-[70vh] overflow-y-auto p-4 rounded-t-2xl border border-neutral-800 bg-neutral-900">
          <div className="text-sm font-medium text-neutral-200 mb-4">Edit comment</div>
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length <= maxChars) setValue(v);
              }}
              placeholder="Update your comment"
              className={`w-full min-h-20 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? "border-red-700" : "border-neutral-800"}`}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = value.trim();
                  if (!trimmed || trimmed.length > maxChars) return;
                  onSave(trimmed);
                }
              }}
            />
            <div className="mt-1 flex items-center justify-end text-[11px]">
              <span className={`${remaining < 0 ? "text-red-500" : "text-neutral-500"}`}>{remaining}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-md" disabled={isSaving}>Cancel</Button>
            <HotkeyButton hotkey={"⏎"} size="sm" onClick={() => { const trimmed = value.trim(); if (!trimmed || trimmed.length > maxChars) return; onSave(trimmed); }} className="rounded-md" disabled={isSaving || value.trim().length === 0}>Save</HotkeyButton>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 w-full max-w-[520px] rounded-xl border border-neutral-800 p-5">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium text-neutral-200 mb-2">Edit comment</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= maxChars) setValue(v);
            }}
            placeholder="Update your comment"
            className={`w-full min-h-20 rounded-md bg-neutral-900 border p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none ${remaining < 0 ? "border-red-700" : "border-neutral-800"}`}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                const trimmed = value.trim();
                if (!trimmed || trimmed.length > maxChars) return;
                onSave(trimmed);
              }
            }}
          />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            {error && <span className="text-red-400">{error}</span>}
            <span className={`${remaining < 0 ? "text-red-500" : "text-neutral-500"}`}>{remaining}</span>
          </div>
        </div>
        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-md" disabled={isSaving}>Cancel</Button>
          <HotkeyButton hotkey={"⏎"} size="sm" onClick={() => { const trimmed = value.trim(); if (!trimmed || trimmed.length > maxChars) return; onSave(trimmed); }} className="rounded-md" disabled={isSaving || value.trim().length === 0}>Save</HotkeyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


