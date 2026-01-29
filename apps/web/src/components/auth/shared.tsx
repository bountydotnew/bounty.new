'use client';

import { useState, useTransition, ReactNode, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';

/**
 * Validates that a URL is a safe relative path to prevent open redirect attacks.
 */
export function isSafeRedirectUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false;
  }
  if (url.includes(':')) {
    return false;
  }
  return true;
}

/**
 * Shared email/password form state hook
 */
export function useEmailPasswordForm(callbackUrl?: string) {
  const safeCallbackUrl: string =
    isSafeRedirectUrl(callbackUrl) && callbackUrl ? callbackUrl : '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSignIn = async (e: FormEvent, isAddingAccount?: boolean) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    startTransition(async () => {
      await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
        callbackURL: safeCallbackUrl,
        fetchOptions: {
          onError: (ctx: {
            error: { message?: string; status?: number };
          }) => {
            if (ctx.error.status === 403) {
              toast.error(
                'Please verify your email address before signing in'
              );
              router.push(
                `/sign-up/verify-email-address?email=${encodeURIComponent(email)}`
              );
            } else {
              toast.error(ctx.error.message || 'Sign in failed');
            }
          },
          onSuccess: () => {
            toast.success('Sign in successful');
            if (isAddingAccount) {
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 500);
            } else {
              window.location.href = safeCallbackUrl;
            }
          },
        },
      });
    });
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    startTransition(async () => {
      await authClient.signUp.email({
        email,
        password,
        name: email.split('@')[0],
        fetchOptions: {
          onError: (ctx: {
            error: { message?: string; status?: number };
          }) => {
            toast.error(ctx.error.message || 'Sign up failed');
          },
          onSuccess: async () => {
            try {
              await authClient.emailOtp.sendVerificationOtp({
                email,
                type: 'sign-in',
              });

              toast.success(
                'Account created! Please check your email to sign in.'
              );
              router.push(
                `/sign-up/verify-email-address?email=${encodeURIComponent(email)}`
              );
            } catch (error) {
              toast.error(
                'Failed to send verification code. Please try again.'
              );
              console.error('OTP send error:', error);
            }
          },
        },
      });
    });
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isPending,
    handleSignIn,
    handleSignUp,
    router,
  };
}

/**
 * Email input field component
 */
export interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function EmailField({ value, onChange, disabled }: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="name@example.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
      />
    </div>
  );
}

/**
 * Password input field component
 */
export interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showForgotPassword?: boolean;
}

export function PasswordField({
  value,
  onChange,
  disabled,
  showForgotPassword = false,
}: PasswordFieldProps) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">Password</Label>
        {showForgotPassword && (
          <Button
            variant="text"
            onClick={() => router.push('/reset-password')}
            disabled={disabled}
            className="text-xs text-gray-400 hover:text-white p-0 h-auto"
            type="button"
          >
            Forgot password?
          </Button>
        )}
      </div>
      <Input
        id="password"
        type="password"
        placeholder="Enter your password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
      />
    </div>
  );
}

/**
 * Submit button component
 */
export interface SubmitButtonProps {
  isPending: boolean;
  children: ReactNode;
}

export function SubmitButton({ isPending, children }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending ? children : children}
    </Button>
  );
}
