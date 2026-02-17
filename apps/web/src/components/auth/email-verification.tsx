'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { cn } from '@bounty/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, m } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Bounty from '../icons/bounty';

const verificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits'),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

const SLOT_IDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

interface EmailVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
  onEditInfo?: () => void;
  initialCode?: string;
}

interface ParsedError {
  message: string;
  shouldSuggestResend: boolean;
}

function parseOtpError(error: unknown): ParsedError {
  const errorMessage =
    error instanceof Error ? error.message : 'Invalid verification code';

  const isExpired = errorMessage.toLowerCase().includes('expired');
  const isUsed = errorMessage.toLowerCase().includes('used');

  if (isExpired) {
    return {
      message: 'This code has expired. Please request a new one.',
      shouldSuggestResend: true,
    };
  }

  if (isUsed) {
    return {
      message: 'This code has already been used. Please request a new one.',
      shouldSuggestResend: true,
    };
  }

  return {
    message: errorMessage.includes('verification')
      ? errorMessage
      : 'Invalid verification code. Please try again.',
    shouldSuggestResend: false,
  };
}

export function EmailVerification({
  email,
  onBack,
  onSuccess,
  onEditInfo,
  initialCode,
}: EmailVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showResendSuggestion, setShowResendSuggestion] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: '' },
  });
  const { setValue, setError } = form;

  // Start cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(prev => prev - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeInput = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const currentCode = form.getValues('code');
    const newCode = currentCode.split('');
    newCode[index] = digit;

    const finalCode = newCode.join('').slice(0, 6);
    form.setValue('code', finalCode);

    // Move to next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace') {
      const currentCode = form.getValues('code');
      const newCode = currentCode.split('');

      if (newCode[index]) {
        // Clear current digit
        newCode[index] = '';
      } else if (index > 0) {
        // Move to previous input and clear it
        newCode[index - 1] = '';
        inputRefs.current[index - 1]?.focus();
      }

      form.setValue('code', newCode.join(''));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    form.setValue('code', pastedData);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (data: VerificationFormData) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp: data.code,
      });

      if (result?.data) {
        // signIn.emailOtp creates a session and marks email as verified
        onSuccess();
      } else if (result?.error) {
        // Handle error from result
        throw new Error(result.error.message || 'Verification failed');
      }
    } catch (error) {
      const parsed = parseOtpError(error);
      setShowResendSuggestion(parsed.shouldSuggestResend);

      form.setError('code', {
        type: 'manual',
        message: parsed.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    setShowResendSuggestion(false); // Clear suggestion after resend
    form.clearErrors('code'); // Clear the error
    setValue('code', ''); // Clear the code input

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });
      setResendCooldown(60); // 60 second cooldown
    } catch {
      // no-op; user can try again
    } finally {
      setIsResending(false);
    }
  };

  // If an initial code is provided via URL, auto-verify once.
  const autoSubmitRef = useRef(false);

  const handleAutoVerify = useCallback(
    async (cleanCode: string) => {
      try {
        const result = await authClient.signIn.emailOtp({
          email,
          otp: cleanCode,
        });

        if (result?.data) {
          // signIn.emailOtp creates a session and marks email as verified
          onSuccess();
        } else if (result?.error) {
          // Handle error from result
          throw new Error(result.error.message || 'Verification failed');
        }
      } catch (error) {
        const parsed = parseOtpError(error);
        setShowResendSuggestion(parsed.shouldSuggestResend);

        setError('code', {
          type: 'manual',
          message: parsed.message,
        });
      }
    },
    [email, onSuccess, setError]
  );

  useEffect(() => {
    const clean = (initialCode || '').replace(/\D/g, '').slice(0, 6);
    if (!autoSubmitRef.current && clean.length === 6) {
      autoSubmitRef.current = true;
      setValue('code', clean);
      handleAutoVerify(clean).catch(() => {
        /* ignore auto-verify failure; user can enter code manually */
      });
    }
  }, [initialCode, handleAutoVerify, setValue]);

  const code = form.watch('code');

  const getResendButtonText = () => {
    if (isResending) {
      return 'Sending...';
    }
    if (resendCooldown > 0) {
      return `Resend code in ${resendCooldown}s`;
    }
    if (showResendSuggestion) {
      return '👉 Click here to get a new code';
    }
    return 'Resend code';
  };

  const getResendButtonClass = () => {
    if (resendCooldown > 0 || isResending) {
      return 'text-gray-500 cursor-not-allowed';
    }
    if (showResendSuggestion) {
      return 'text-primary hover:text-primary/80 underline font-semibold animate-pulse';
    }
    return 'text-foreground hover:text-gray-200 underline';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 flex items-center justify-center">
          <Bounty className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Check your email
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We sent a verification code to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {SLOT_IDS.map((slotId, index) => (
              <Input
                key={`otp-${slotId}`}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[index] || ''}
                onChange={(e) => handleCodeInput(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                onFocus={() => setFocusedField('code')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                className={cn(
                  'w-12 h-10 text-center text-lg font-medium transition-all duration-200',
                  form.formState.errors.code
                    ? 'border-destructive focus-visible:border-destructive'
                    : 'focus-visible:border-primary'
                )}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {form.formState.errors.code ? (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center text-sm text-destructive font-medium"
              >
                {form.formState.errors.code?.message}
              </m.div>
            ) : focusedField === 'code' ? (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center text-sm text-gray-400"
              >
                Enter the 6-digit code from your email
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full h-10 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            'Verifying...'
          ) : (
            <>
              Verify email
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isResending}
            className={cn(
              'text-sm font-medium transition-all duration-200',
              getResendButtonClass()
            )}
          >
            {getResendButtonText()}
          </button>
        </div>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => (onEditInfo ? onEditInfo() : onBack())}
            className="text-sm text-gray-400 hover:text-gray-200 underline block w-full"
          >
            ← Back to sign up
          </button>
        </div>
      </div>
    </div>
  );
}
