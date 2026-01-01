
'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { PaymentMethodCard } from './payment-method-card';
import { AwardBalanceIcon } from '@/components/icons/award-balance-icon';
import { StripePaymentIcon } from '@/components/icons/stripe-payment-icon';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import * as React from 'react';

interface FundBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyAmount: number;
  onSkip: () => void;
  onPayWithStripe: () => void;
  onPayWithBalance?: () => void;
  isLoading?: boolean;
}

export function FundBountyModal({
  open,
  onOpenChange,
  bountyAmount,
  onSkip,
  onPayWithStripe,
  onPayWithBalance,
  isLoading = false,
}: FundBountyModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'balance' | 'stripe' | null>(null);

  const handleContinue = () => {
    // Only Stripe payments are supported for now
    if (isLoading) return;
    onPayWithStripe();
  };

  const handleSkip = () => {
    if (isLoading) return;
    onSkip();
    setSelectedMethod(null);
  };

  // Reset selection when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing modal while processing
      if (!isLoading) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent
        overlayVariant="solid"
        className="flex flex-col items-center gap-8 border-none bg-transparent p-0 shadow-none max-w-none w-auto"
      >
        <DialogTitle className="sr-only">Fund your bounty</DialogTitle>
        {/* Header - Outside modal card */}
        <div className="flex flex-col justify-center items-start w-[403px]">
          <h2 className="text-[28px] leading-[150%] text-white font-medium mb-2">
            Fund your bounty
          </h2>
          <p className="text-[16px] leading-[150%] text-[#B5B5B5] font-medium">
            Select a payment method to proceed with creating your bounty
          </p>
        </div>

        {/* Modal Card */}
        <div className="bg-[#191919] border border-solid border-[#232323] rounded-[17px] overflow-hidden w-[403px]">
          <div className="flex flex-col items-center gap-8">
            {/* Payment Method Cards */}
            <div className="flex flex-col items-start gap-9 w-full py-12">
              <div className="flex justify-center items-start gap-4 px-10 w-full">
                {/* Award Balance Card - Coming Soon */}
                <PaymentMethodCard
                  icon={<AwardBalanceIcon />}
                  label="Fund with award balance"
                  sublabel="Coming soon"
                  selected={false}
                  disabled={true}
                  onClick={() => {}}
                />

                {/* Stripe Card */}
                <PaymentMethodCard
                  icon={<StripePaymentIcon />}
                  label="Fund with Stripe"
                  selected={selectedMethod === 'stripe' || selectedMethod === null}
                  onClick={() => setSelectedMethod('stripe')}
                  overflowHidden
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end items-center gap-1 w-full px-3 pb-2">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="w-fit h-[29px] rounded-[17px] flex justify-center items-center px-4 py-0 bg-[#0E0E0E] border border-solid border-[#232323] text-[13px] leading-[150%] text-[#F2F2DD] font-medium hover:bg-[#151515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoading}
                className="w-fit min-w-[80px] h-[29px] rounded-[17px] flex justify-center items-center px-4 py-0 bg-white border border-solid border-[#232323] text-[13px] leading-[150%] text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-black" />
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note - Outside modal card */}
        <p className="text-[11px] leading-[150%] w-[403px] h-[33px] text-[#222222] font-medium text-center">
          While funding your bounty at this stage is optional, no one will be able to see or submit until it's funded.
        </p>
      </DialogContent>
    </Dialog>
  );
}
