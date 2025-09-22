'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { Separator } from '@bounty/ui/components/separator';
import {
  CreditCard,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';

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
  currency
}: BountyPaymentStepperProps) {
  const [currentStep, setCurrentStep] = useState<Step>('method_selection');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
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
    }
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
    }
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
        cardDetails
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
      cardholderName: ''
    });
    onOpenChange(false);
  };

  const isCardDetailsValid = () => {
    return cardDetails.cardNumber.length >= 16 &&
           cardDetails.expiryDate.length >= 5 &&
           cardDetails.cvv.length >= 3 &&
           cardDetails.cardholderName.length >= 2;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
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
      <div className="text-center space-y-1">
        <h3 className="font-medium">Fund Bounty</h3>
        <p className="text-sm text-muted-foreground">{bountyTitle}</p>
        <div className="text-lg font-semibold">${bountyAmount.toFixed(2)} {currency}</div>
      </div>

      <div className="space-y-2">
        <button
          className={`w-full p-3 border rounded-lg text-left transition-colors ${
            selectedMethod === 'payment_link'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleMethodSelection('payment_link')}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full border ${
              selectedMethod === 'payment_link' ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`} />
            <ExternalLink className="w-4 h-4" />
            <div>
              <div className="font-medium text-sm">Payment Link</div>
              <div className="text-xs text-muted-foreground">Secure payment page</div>
            </div>
          </div>
        </button>

        <button
          className={`w-full p-3 border rounded-lg text-left transition-colors ${
            selectedMethod === 'manual_card'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleMethodSelection('manual_card')}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full border ${
              selectedMethod === 'manual_card' ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`} />
            <CreditCard className="w-4 h-4" />
            <div>
              <div className="font-medium text-sm">Card Entry</div>
              <div className="text-xs text-muted-foreground">Enter card details</div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleNext}
          disabled={!selectedMethod}
          size="sm"
          className="gap-1"
        >
          Next <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  const renderCardDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="text"
          onClick={handleBack}
          size="sm"
          className="gap-1 p-0"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <h3 className="font-medium">Card Details</h3>
        <div className="w-12" />
      </div>

      <div className="text-center">
        <div className="text-lg font-semibold">${bountyAmount.toFixed(2)} {currency}</div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="cardNumber" className="text-sm">Card Number</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
            onChange={(e) => setCardDetails(prev => ({
              ...prev,
              cardNumber: formatCardNumber(e.target.value)
            }))}
            maxLength={19}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="expiryDate" className="text-sm">Expiry</Label>
            <Input
              id="expiryDate"
              placeholder="MM/YY"
              value={cardDetails.expiryDate}
              onChange={(e) => setCardDetails(prev => ({
                ...prev,
                expiryDate: formatExpiryDate(e.target.value)
              }))}
              maxLength={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cvv" className="text-sm">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={cardDetails.cvv}
              onChange={(e) => setCardDetails(prev => ({
                ...prev,
                cvv: e.target.value.replace(/\D/g, '')
              }))}
              maxLength={4}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cardholderName" className="text-sm">Name</Label>
          <Input
            id="cardholderName"
            placeholder="John Doe"
            value={cardDetails.cardholderName}
            onChange={(e) => setCardDetails(prev => ({
              ...prev,
              cardholderName: e.target.value
            }))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleNext}
          disabled={!isCardDetailsValid()}
          size="sm"
          className="gap-1"
        >
          Process Payment <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="space-y-4 text-center">
      <div className="space-y-1">
        <h3 className="font-medium">Processing Payment</h3>
        <p className="text-sm text-muted-foreground">Please wait...</p>
      </div>
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-4 text-center">
      <div className="space-y-2">
        <div className="mx-auto w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-medium">Payment Successful!</h3>
        <p className="text-sm text-muted-foreground">Bounty funded successfully</p>
      </div>

      <div className="bg-muted/30 p-3 rounded-lg">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">${bountyAmount.toFixed(2)} {currency}</span>
          </div>
        </div>
      </div>

      <Button onClick={handleClose} size="sm" className="w-full">
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
    <Dialog open={open} onOpenChange={handleClose}>
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