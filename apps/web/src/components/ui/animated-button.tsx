'use client';

import { Button, type ButtonProps } from '@bounty/ui/components/button';
import { motion, AnimatePresence } from 'motion/react';
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
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`relative overflow-hidden transition-all duration-300 ${
        isSuccess ? 'bg-green-600 hover:bg-green-700' : ''
      } ${props.className || ''}`}
    >
      <motion.div
        className="flex items-center justify-center gap-2"
        animate={{
          scale: isLoading ? 0.95 : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {isLoading && (
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.span
            key={buttonContent?.toString()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {buttonContent}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Ripple effect on success */}
      {isSuccess && (
        <motion.div
          className="absolute inset-0 rounded-md bg-white/20"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </Button>
  );
}