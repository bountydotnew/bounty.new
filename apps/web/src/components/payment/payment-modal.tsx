'use client';

import { DollarSign, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      <DialogContent className="bg-background sm:max-w-md" showOverlay>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <DialogTitle>Support {recipientName}</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Send a tip to @{recipientUsername} for their contribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preset Amounts */}
          <div>
            <Label className="mb-3 block font-medium text-sm">
              Quick amounts
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  className="h-12 font-semibold text-base"
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

          {/* Custom Amount */}
          {allowCustomAmount && (
            <div>
              <Label
                className="mb-2 block font-medium text-sm"
                htmlFor="custom-amount"
              >
                Custom amount
              </Label>
              <div className="relative">
                <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-500" />
                <Input
                  className="pl-9"
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

          {/* Optional Message */}
          <div>
            <Label className="mb-2 block font-medium text-sm" htmlFor="message">
              Message (optional)
            </Label>
            <textarea
              className="h-20 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm"
              id="message"
              maxLength={200}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thanks for the great work!"
              value={message}
            />
            <div className="mt-1 text-gray-500 text-xs">
              {message.length}/200 characters
            </div>
          </div>

          {/* Amount Summary */}
          {getSelectedAmount() > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-xl">
                  ${getSelectedAmount().toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
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
