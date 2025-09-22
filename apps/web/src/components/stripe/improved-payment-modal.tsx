'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { CreditCard, Heart, Shield, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';
import { PaymentForm } from './payment-form';
import { StripeProvider } from './stripe-provider';

interface ImprovedPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
  bountyTitle: string;
  bountyAmount: number;
  bountyCurrency: string;
  recipientName: string;
  recipientUsername: string;
}

type PaymentStep = 'overview' | 'payment' | 'success';

export function ImprovedPaymentModal({
  open,
  onOpenChange,
  bountyId,
  bountyTitle,
  bountyAmount,
  bountyCurrency,
  recipientName,
  recipientUsername,
}: ImprovedPaymentModalProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('overview');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const createPaymentIntent = trpc.stripe.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.data.clientSecret);
      setPaymentIntentId(data.data.paymentIntentId);
      setCurrentStep('payment');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const confirmPayment = trpc.stripe.confirmPayment.useMutation({
    onSuccess: () => {
      setCurrentStep('success');
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartPayment = () => {
    createPaymentIntent.mutate({
      bountyId,
    });
  };

  const handlePaymentSuccess = () => {
    if (paymentIntentId) {
      confirmPayment.mutate({
        paymentIntentId,
        bountyId,
      });
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  // Reset modal state when closing
  useEffect(() => {
    if (!open) {
      setCurrentStep('overview');
      setClientSecret(null);
      setPaymentIntentId(null);
    }
  }, [open]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border border-neutral-800 bg-neutral-900/95 p-0 backdrop-blur-xl sm:max-w-lg">
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === 'overview' && (
              <motion.div
                animate="visible"
                exit="exit"
                initial="hidden"
                key="overview"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                variants={stepVariants}
              >
                <DialogHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-white text-xl">
                        Fund Bounty
                      </DialogTitle>
                      <DialogDescription className="text-neutral-400">
                        Pay for "{bountyTitle}"
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 px-6 pb-6">
                  {/* Amount Display */}
                  <div className="rounded-xl border border-neutral-800 bg-gradient-to-r from-neutral-900/80 to-neutral-800/40 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-neutral-400 text-sm">Total Amount</p>
                        <p className="font-bold text-3xl text-white">
                          {formatAmount(bountyAmount, bountyCurrency)}
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-neutral-500" />
                    </div>
                  </div>

                  {/* Payment Features */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
                      <Zap className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                      <p className="font-medium text-neutral-300 text-xs">
                        Instant
                      </p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
                      <Shield className="mx-auto mb-2 h-6 w-6 text-green-500" />
                      <p className="font-medium text-neutral-300 text-xs">
                        Secure
                      </p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
                      <Heart className="mx-auto mb-2 h-6 w-6 text-pink-500" />
                      <p className="font-medium text-neutral-300 text-xs">
                        Easy
                      </p>
                    </div>
                  </div>

                  {/* Recipient Info */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <p className="text-neutral-400 text-sm">Bounty Creator</p>
                    <p className="font-medium text-white">
                      {recipientName} (@{recipientUsername})
                    </p>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    disabled={createPaymentIntent.isPending}
                    onClick={handleStartPayment}
                    size="lg"
                  >
                    {createPaymentIntent.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Preparing Payment...
                      </div>
                    ) : (
                      'Continue to Payment'
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 'payment' && clientSecret && (
              <motion.div
                animate="visible"
                exit="exit"
                initial="hidden"
                key="payment"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                variants={stepVariants}
              >
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle className="flex items-center gap-2 text-white">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Complete your payment securely
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6">
                  <StripeProvider clientSecret={clientSecret}>
                    <PaymentForm
                      amount={bountyAmount * 100}
                      bountyId={bountyId} // Convert to cents
                      currency={bountyCurrency}
                      onError={handlePaymentError}
                      onSuccess={handlePaymentSuccess}
                    />
                  </StripeProvider>
                </div>
              </motion.div>
            )}

            {currentStep === 'success' && (
              <motion.div
                animate="visible"
                className="px-6 py-12 text-center"
                exit="exit"
                initial="hidden"
                key="success"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                variants={stepVariants}
              >
                <motion.div
                  animate={{ scale: 1 }}
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                  initial={{ scale: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Heart className="h-8 w-8 text-white" />
                </motion.div>

                <h3 className="mb-2 font-bold text-white text-xl">
                  Payment Successful!
                </h3>
                <p className="mb-6 text-neutral-400">
                  Your bounty payment of{' '}
                  <span className="font-semibold text-white">
                    {formatAmount(bountyAmount, bountyCurrency)}
                  </span>{' '}
                  has been processed successfully.
                </p>

                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-green-400 text-sm">
                    ✅ Bounty is now funded and ready for work!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
