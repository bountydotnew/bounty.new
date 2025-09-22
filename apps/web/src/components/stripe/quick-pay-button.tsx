'use client';

import { Button } from '@bounty/ui/components/button';
import { CreditCard, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ImprovedPaymentModal } from './improved-payment-modal';

interface QuickPayButtonProps {
  bountyId: string;
  bountyTitle: string;
  bountyAmount: number;
  bountyCurrency: string;
  recipientName: string;
  recipientUsername: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  onPaymentComplete?: () => void;
}

export function QuickPayButton({
  bountyId,
  bountyTitle,
  bountyAmount,
  bountyCurrency,
  recipientName,
  recipientUsername,
  size = 'md',
  variant = 'default',
  className = '',
  onPaymentComplete,
}: QuickPayButtonProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <>
      <motion.div
        transition={{ duration: 0.2, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          className={`relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 ${className}`}
          onClick={() => setShowPaymentModal(true)}
          size={size}
          variant={variant}
        >
          {/* Animated background */}
          <motion.div
            animate={{
              opacity: [0, 0.3, 0],
              scale: [1, 1.05, 1],
            }}
            className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0"
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />

          <div className="relative flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Fund {formatAmount(bountyAmount, bountyCurrency)}
          </div>
        </Button>
      </motion.div>

      <ImprovedPaymentModal
        bountyAmount={bountyAmount}
        bountyCurrency={bountyCurrency}
        bountyId={bountyId}
        bountyTitle={bountyTitle}
        onOpenChange={(open) => {
          setShowPaymentModal(open);
          if (!open && onPaymentComplete) {
            onPaymentComplete();
          }
        }}
        open={showPaymentModal}
        recipientName={recipientName}
        recipientUsername={recipientUsername}
      />
    </>
  );
}
