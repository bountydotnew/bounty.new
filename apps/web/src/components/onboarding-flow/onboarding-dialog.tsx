'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

export interface OnboardingDialogProps {
  open: boolean;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  skipLabel?: string;
  onSkip?: () => void;
  isLoading?: boolean;
  footerNote?: string;
  maxWidth?: string;
}

export function OnboardingDialog({
  open,
  title,
  subtitle,
  children,
  actionLabel,
  onAction,
  skipLabel,
  onSkip,
  isLoading = false,
  footerNote,
  maxWidth = '403px',
}: OnboardingDialogProps) {
  const handleAction = () => {
    if (isLoading) return;
    onAction();
  };

  const handleSkip = () => {
    if (isLoading) return;
    onSkip?.();
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      // Don't allow closing dialog - only through action/skip buttons
    }}>
      <DialogContent
        overlayVariant="solid"
        className="flex flex-col items-center gap-8 border-none bg-transparent p-0 shadow-none max-w-none w-auto"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Header - Outside modal card */}
        <div className="flex flex-col justify-center items-start w-full" style={{ maxWidth }}>
          <h2 className="text-[28px] leading-[150%] text-white font-medium mb-2">
            {title}
          </h2>
          <p className="text-[16px] leading-[150%] text-[#B5B5B5] font-medium">
            {subtitle}
          </p>
        </div>

        {/* Modal Card */}
        <div className="bg-[#191919] border border-solid border-[#232323] rounded-[17px] overflow-hidden w-full" style={{ maxWidth }}>
          <div className="flex flex-col">
            {/* Content */}
            <div className="p-8">
              {children}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end items-center gap-1 w-full px-3 pb-2">
              {skipLabel && onSkip && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="w-fit h-[29px] rounded-[17px] flex justify-center items-center px-4 py-0 bg-[#0E0E0E] border border-solid border-[#232323] text-[13px] leading-[150%] text-[#F2F2DD] font-medium hover:bg-[#151515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-none"
                >
                  {skipLabel}
                </button>
              )}
              <button
                type="button"
                onClick={handleAction}
                disabled={isLoading}
                className="w-fit min-w-[80px] h-[29px] rounded-[17px] flex justify-center items-center px-4 py-0 bg-white border border-solid border-[#232323] text-[13px] leading-[150%] text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-none"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-black" />
                ) : (
                  actionLabel
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note - Outside modal card */}
        {footerNote && (
          <p className="text-[11px] leading-[150%] w-full text-[#222222] font-medium text-center" style={{ maxWidth }}>
            {footerNote}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
