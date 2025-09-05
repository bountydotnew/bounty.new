'use client';

import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAsDraft: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onSaveAsDraft,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-primary" />
            <h2 className="font-semibold text-xl">Unsaved Changes</h2>
            <p className="mt-2 text-muted-foreground">
              You have unsaved changes. What would you like to do?
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onSaveAsDraft}>
              <FileText className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>

            <Button
              className="w-full"
              onClick={onDiscard}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Discard Changes
            </Button>

            <Button className="w-full" onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
