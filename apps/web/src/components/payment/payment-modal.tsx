'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { DollarSign, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientUsername: string;
  presetAmounts?: number[];
  allowCustomAmount?: boolean;
}

export function PaymentModal({
  open,
  onOpenChange,
  recipientName,
  recipientUsername,
  presetAmounts = [5, 10, 25, 50],
  allowCustomAmount = true,
}: PaymentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getSelectedAmount = () => {
    if (selectedAmount) {
      return selectedAmount;
    }
    if (customAmount) {
      return Number.parseFloat(customAmount);
    }
    return 0;
  };

  const handlePayment = async () => {
    const amount = getSelectedAmount();

    if (!amount || amount <= 0) {
      toast.error('Please select or enter a valid amount');
      return;
    }

    setIsProcessing(true);

    // TODO: Implement actual payment processing
    // For now, just simulate processing
    setTimeout(() => {
      toast.success(`Payment of $${amount} sent to ${recipientName}!`);
      setIsProcessing(false);
      onOpenChange(false);

      // Reset form
      setSelectedAmount(null);
      setCustomAmount('');
      setMessage('');
    }, 2000);
  };

  const isValidAmount = () => {
    const amount = getSelectedAmount();
    return amount > 0 && amount <= 10_000; // Max $10,000
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="border border-neutral-800 bg-neutral-900/90 p-0 backdrop-blur sm:max-w-md"
        showOverlay
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <DialogTitle className="text-white">
              Support {recipientName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-neutral-400">
            Send a tip to @{recipientUsername} for their contribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-6">
          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label className="text-sm">Quick amounts</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presetAmounts.map((amount) => (
                <Button
                  className={
                    selectedAmount === amount
                      ? 'h-10'
                      : 'h-10 border-neutral-800 hover:bg-neutral-900/60'
                  }
                  key={amount}
                  onClick={() => handlePresetSelect(amount)}
                  variant={selectedAmount === amount ? 'default' : 'outline'}
                >
                  <DollarSign className="mr-1 h-4 w-4" />
                  {amount}
                </Button>
              ))}
            </div>
          </div>

          {allowCustomAmount && (
            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label className="text-sm" htmlFor="custom-amount">
                Custom amount
              </Label>
              <div className="relative">
                <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-neutral-500" />
                <Input
                  className="border-neutral-800 bg-neutral-900/60 pl-9 text-white placeholder-neutral-500"
                  id="custom-amount"
                  max="10000"
                  min="1"
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={customAmount}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
            <Label className="text-sm" htmlFor="message">
              Message (optional)
            </Label>
            <textarea
              className="h-24 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-white placeholder-neutral-500"
              id="message"
              maxLength={200}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thanks for the great work!"
              value={message}
            />
            <div className="text-neutral-500 text-xs">
              {message.length}/200 characters
            </div>
          </div>

          {getSelectedAmount() > 0 && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Total</span>
                <span className="font-semibold text-white text-xl">
                  ${getSelectedAmount().toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pt-2 pb-6">
          <Button
            className="border-neutral-800"
            disabled={isProcessing}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="min-w-24"
            disabled={!isValidAmount() || isProcessing}
            onClick={handlePayment}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing
              </div>
            ) : (
              `Send $${getSelectedAmount().toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
