"use client";

import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Unsaved Changes</h2>
            <p className="text-muted-foreground mt-2">
              You have unsaved changes. What would you like to do?
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={onSaveAsDraft} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            
            <Button 
              onClick={onDiscard} 
              variant="destructive" 
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Discard Changes
            </Button>
            
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 