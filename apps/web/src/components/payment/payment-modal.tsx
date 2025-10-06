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
import { DollarSign } from 'lucide-react';

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

  const handlePayment = () => {
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
          <DialogTitle className="text-white">
            Support {recipientName}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Send a tip to @{recipientUsername} for their contribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-6">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-center">
            <DollarSign className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
            <p className="text-neutral-300 text-sm">
              Payment processing is not yet implemented.
            </p>
            <p className="mt-1 text-neutral-500 text-xs">
              This is a placeholder component.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 pt-2 pb-6">
          <Button
            className="border-neutral-800"
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
