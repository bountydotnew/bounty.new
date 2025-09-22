'use client';

import { Button, type ButtonProps } from '@bounty/ui/components/button';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useState } from 'react';

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  loadingText?: string;
  successText?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  successDuration?: number;
}

export function AnimatedButton({
  children,
  loadingText = 'Loading...',
  successText = 'Success!',
  isLoading = false,
  isSuccess = false,
  successDuration = 2000,
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = (e: any) => {
    if (isSuccess && !showSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), successDuration);
    }
    onClick?.(e);
  };

  const buttonContent = (() => {
    if (isLoading) return loadingText;
    if (isSuccess && showSuccess) return successText;
    return children;
  })();

  return (
    <Button
      {...props}
      className={`relative overflow-hidden transition-all duration-300 ${
        isSuccess ? 'bg-green-600 hover:bg-green-700' : ''
      } ${props.className || ''}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      <motion.div
        animate={{
          scale: isLoading ? 0.95 : 1,
          opacity: 1,
        }}
        className="flex items-center justify-center gap-2"
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            initial={{ opacity: 0, y: 5 }}
            key={buttonContent?.toString()}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {buttonContent}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Ripple effect on success */}
      {isSuccess && (
        <motion.div
          animate={{ scale: 4, opacity: 0 }}
          className="absolute inset-0 rounded-md bg-white/20"
          initial={{ scale: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </Button>
  );
}
