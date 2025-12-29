'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { PaymentForm } from './payment-form';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface BountyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
  amount: number;
  fees: number;
  totalWithFees: number;
  currency?: string;
  clientSecret?: string | null; // Optional - if provided, use it directly
  onSuccess?: () => void;
}

export function BountyPaymentDialog({
  open,
  onOpenChange,
  bountyId,
  amount,
  fees,
  totalWithFees,
  currency = 'USD',
  clientSecret: initialClientSecret,
  onSuccess,
}: BountyPaymentDialogProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(initialClientSecret || null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Update clientSecret when prop changes
  useEffect(() => {
    setClientSecret(initialClientSecret || null);
  }, [initialClientSecret]);

  const createPayment = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.createPaymentForBounty.mutate({
        bountyId,
      });
    },
    onSuccess: (result) => {
      if (result?.data?.clientSecret) {
        setClientSecret(result.data.clientSecret);
        setIsCreatingPayment(false);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create payment: ${error.message}`);
      setIsCreatingPayment(false);
    },
  });

  const handlePayLater = () => {
    onOpenChange(false);
    toast.success('Bounty created! Complete payment to make it live.');
    router.push(`/bounty/${bountyId}`);
  };

  const handleStartPayment = () => {
    if (clientSecret) {
      // Already have client secret, show payment form
      return;
    }
    setIsCreatingPayment(true);
    createPayment.mutate();
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment confirmed! Bounty is now live.');
    onOpenChange(false);
    setClientSecret(null);
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/bounty/${bountyId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay ${totalWithFees.toFixed(2)} ({currency} {amount.toFixed(2)} + ${fees.toFixed(2)} fees) to make your bounty live
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {clientSecret ? (
            <div>
              <div className="rounded-lg border border-border bg-background p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Bounty Amount</span>
                  <span className="font-medium">{currency} {amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Processing Fees (2.9% + $0.30)</span>
                  <span className="font-medium">${fees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">${totalWithFees.toFixed(2)}</span>
                </div>
              </div>
              <PaymentForm
                clientSecret={clientSecret}
                bountyId={bountyId}
                onSuccess={handlePaymentSuccess}
                onCancel={() => {
                  setClientSecret(null);
                  setIsCreatingPayment(false);
                }}
              />
            </div>
          ) : (
            <div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Bounty Amount</span>
                  <span className="font-medium">{currency} {amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Processing Fees (2.9% + $0.30)</span>
                  <span className="font-medium">${fees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">${totalWithFees.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handlePayLater}>
                  Pay Later
                </Button>
                <Button onClick={handleStartPayment} disabled={isCreatingPayment}>
                  {isCreatingPayment ? 'Preparing payment...' : 'Pay Now'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
