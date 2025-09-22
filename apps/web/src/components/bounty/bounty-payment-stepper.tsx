'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent, DialogHeader,
  DialogTitle
} from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';

interface BountyPaymentStepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
  bountyTitle: string;
  bountyAmount: number;
  currency: string;
}

type PaymentMethod = 'payment_link' | 'manual_card';
type Step = 'method_selection' | 'card_details' | 'processing' | 'success';

interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export function BountyPaymentStepper({
  open,
  onOpenChange,
  bountyId,
  bountyTitle,
  bountyAmount,
  currency,
}: BountyPaymentStepperProps) {
  const [currentStep, setCurrentStep] = useState<Step>('method_selection');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const createPaymentLink = useMutation({
    ...trpc.bounties.createPaymentLink.mutationOptions(),
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
        setCurrentStep('success');
      }
    },
    onError: (error) => {
      toast.error(`Payment failed: ${error.message}`);
    },
  });

  const processManualPayment = useMutation({
    ...trpc.bounties.processManualPayment.mutationOptions(),
    onSuccess: () => {
      setCurrentStep('success');
      toast.success('Payment processed successfully!');
    },
    onError: (error) => {
      toast.error(`Payment failed: ${error.message}`);
      setCurrentStep('card_details');
    },
  });

  const handleMethodSelection = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleNext = () => {
    if (currentStep === 'method_selection') {
      if (!selectedMethod) {
        toast.error('Please select a payment method');
        return;
      }

      if (selectedMethod === 'payment_link') {
        setCurrentStep('processing');
        createPaymentLink.mutate({ bountyId });
      } else {
        setCurrentStep('card_details');
      }
    } else if (currentStep === 'card_details') {
      if (!isCardDetailsValid()) {
        toast.error('Please fill in all card details');
        return;
      }

      setCurrentStep('processing');
      processManualPayment.mutate({
        bountyId,
        cardDetails,
      });
    }
  };

  const handleBack = () => {
    if (currentStep === 'card_details') {
      setCurrentStep('method_selection');
    }
  };

  const handleClose = () => {
    setCurrentStep('method_selection');
    setSelectedMethod(null);
    setCardDetails({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    });
    onOpenChange(false);
  };

  const isCardDetailsValid = () => {
    return (
      cardDetails.cardNumber.length >= 16 &&
      cardDetails.expiryDate.length >= 5 &&
      cardDetails.cvv.length >= 3 &&
      cardDetails.cardholderName.length >= 2
    );
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h3 className="font-medium">Fund Bounty</h3>
        <p className="text-muted-foreground text-sm">{bountyTitle}</p>
        <div className="font-semibold text-lg">
          ${bountyAmount.toFixed(2)} {currency}
        </div>
      </div>

      <div className="space-y-2">
        <button
          className={`w-full rounded-lg border p-3 text-left transition-colors ${
            selectedMethod === 'payment_link'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleMethodSelection('payment_link')}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`h-3 w-3 rounded-full border ${
                selectedMethod === 'payment_link'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}
            />
            <ExternalLink className="h-4 w-4" />
            <div>
              <div className="font-medium text-sm">Payment Link</div>
              <div className="text-muted-foreground text-xs">
                Secure payment page
              </div>
            </div>
          </div>
        </button>

        <button
          className={`w-full rounded-lg border p-3 text-left transition-colors ${
            selectedMethod === 'manual_card'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleMethodSelection('manual_card')}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`h-3 w-3 rounded-full border ${
                selectedMethod === 'manual_card'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}
            />
            <CreditCard className="h-4 w-4" />
            <div>
              <div className="font-medium text-sm">Card Entry</div>
              <div className="text-muted-foreground text-xs">
                Enter card details
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          className="gap-1"
          disabled={!selectedMethod}
          onClick={handleNext}
          size="sm"
        >
          Next <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const renderCardDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          className="gap-1 p-0"
          onClick={handleBack}
          size="sm"
          variant="text"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
        <h3 className="font-medium">Card Details</h3>
        <div className="w-12" />
      </div>

      <div className="text-center">
        <div className="font-semibold text-lg">
          ${bountyAmount.toFixed(2)} {currency}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm" htmlFor="cardNumber">
            Card Number
          </Label>
          <Input
            className="mt-1"
            id="cardNumber"
            maxLength={19}
            onChange={(e) =>
              setCardDetails((prev) => ({
                ...prev,
                cardNumber: formatCardNumber(e.target.value),
              }))
            }
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm" htmlFor="expiryDate">
              Expiry
            </Label>
            <Input
              className="mt-1"
              id="expiryDate"
              maxLength={5}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  expiryDate: formatExpiryDate(e.target.value),
                }))
              }
              placeholder="MM/YY"
              value={cardDetails.expiryDate}
            />
          </div>

          <div>
            <Label className="text-sm" htmlFor="cvv">
              CVV
            </Label>
            <Input
              className="mt-1"
              id="cvv"
              maxLength={4}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  cvv: e.target.value.replace(/\D/g, ''),
                }))
              }
              placeholder="123"
              value={cardDetails.cvv}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm" htmlFor="cardholderName">
            Name
          </Label>
          <Input
            className="mt-1"
            id="cardholderName"
            onChange={(e) =>
              setCardDetails((prev) => ({
                ...prev,
                cardholderName: e.target.value,
              }))
            }
            placeholder="John Doe"
            value={cardDetails.cardholderName}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          className="gap-1"
          disabled={!isCardDetailsValid()}
          onClick={handleNext}
          size="sm"
        >
          Process Payment <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="space-y-4 text-center">
      <div className="space-y-1">
        <h3 className="font-medium">Processing Payment</h3>
        <p className="text-muted-foreground text-sm">Please wait...</p>
      </div>
      <div className="flex justify-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-4 text-center">
      <div className="space-y-2">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
          <Check className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-medium">Payment Successful!</h3>
        <p className="text-muted-foreground text-sm">
          Bounty funded successfully
        </p>
      </div>

      <div className="rounded-lg bg-muted/30 p-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">
              ${bountyAmount.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleClose} size="sm">
        Close
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'method_selection':
        return renderMethodSelection();
      case 'card_details':
        return renderCardDetails();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      default:
        return renderMethodSelection();
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-sm">
        {currentStep !== 'success' && (
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center">Fund Bounty</DialogTitle>
          </DialogHeader>
        )}

        <div className={currentStep === 'success' ? 'py-4' : ''}>
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
