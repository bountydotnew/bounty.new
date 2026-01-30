'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // If there's a token in the URL, show the reset form
  useEffect(() => {
    if (token) {
      setStep('reset');
    }
  }, [token]);

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    startTransition(async () => {
      try {
        await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        toast.success('Password reset link sent! Check your email.');
        setEmailSent(true);
      } catch (error) {
        toast.error('Failed to send reset link. Please try again.');
        console.error('Reset password error:', error);
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    startTransition(async () => {
      try {
        await authClient.resetPassword({
          newPassword,
          token,
        });
        toast.success('Password reset successful! You can now sign in.');
        router.push('/login');
      } catch (error) {
        toast.error('Failed to reset password. The link may have expired.');
        console.error('Reset password error:', error);
      }
    });
  };

  if (step === 'reset') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reset your password
          </h1>
          <p className="text-gray-400 text-sm">Enter your new password below</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Resetting password...' : 'Reset password'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="text"
            onClick={() => router.push('/login')}
            disabled={isPending}
            className="text-sm text-gray-400 hover:text-foreground"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="text-gray-400 text-sm">
          Enter your email below and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Sending reset link...' : 'Send reset link'}
        </Button>
      </form>

      {emailSent && (
        <div className="space-y-3">
          <div className="rounded-lg bg-surface-1 p-4 border border-border-strong">
            <p className="text-sm text-gray-400 text-center">
              Haven&apos;t received the email? Check your spam folder or resend
              it below.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleRequestReset}
            disabled={isPending}
          >
            {isPending ? 'Resending...' : 'Resend email'}
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button
          variant="text"
          onClick={() => router.push('/login')}
          disabled={isPending}
          className="text-sm text-gray-400 hover:text-foreground"
        >
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
