'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLinkAccount } from '@/hooks/use-link-account';

interface AuthFormProps {
  callbackUrl?: string;
  isAddingAccount?: boolean;
}

/**
 * Validates that a URL is a safe relative path to prevent open redirect attacks.
 * Only allows paths that start with '/' and don't contain protocol or domain.
 */
function isSafeRedirectUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  // Must start with / and not //
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false;
  }

  // Must not contain protocol (http:, https:, javascript:, etc.)
  if (url.includes(':')) {
    return false;
  }

  return true;
}

export default function AuthForm({ callbackUrl, isAddingAccount }: AuthFormProps) {
  // Validate and sanitize the callback URL to prevent open redirects
  const safeCallbackUrl: string =
    isSafeRedirectUrl(callbackUrl) && callbackUrl ? callbackUrl : '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();
  const { linkAccount } = useLinkAccount();
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Get previous user ID from sessionStorage when adding account
  useEffect(() => {
    if (isAddingAccount) {
      const stored = sessionStorage.getItem('bounty-previous-user-id');
      if (stored) {
        setPreviousUserId(stored);
      } else {
        // Try to get from current session
        authClient.getSession().then(({ data }) => {
          if (data?.user?.id) {
            setPreviousUserId(data.user.id);
            sessionStorage.setItem('bounty-previous-user-id', data.user.id);
          }
        });
      }
    }
  }, [isAddingAccount]);

  const handleEmailPasswordAuth = (e: React.FormEvent) => {
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
      if (mode === 'signup') {
        // Sign-up flow: redirect to verify page
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
              // Trigger OTP send after successful sign-up
              // Use 'sign-in' type to auto-sign-in after verification
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
      } else {
        // Sign-in flow: redirect to dashboard
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
            onSuccess: async () => {
              toast.success('Sign in successful');
              
              // Link accounts if we're adding an account and have a previous user ID
              if (isAddingAccount && previousUserId) {
                try {
                  // Get the new user's session
                  const { data: newSession } = await authClient.getSession();
                  if (newSession?.user?.id && newSession.user.id !== previousUserId) {
                    await linkAccount(previousUserId);
                  }
                } catch (error) {
                  console.error('Failed to link accounts:', error);
                  // Don't show error to user, linking can happen later
                }
                // Clear the stored previous user ID
                sessionStorage.removeItem('bounty-previous-user-id');
              }
              
              if (isAddingAccount) {
                // When adding account, redirect to dashboard to refresh sessions
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 500);
              } else {
                window.location.href = safeCallbackUrl;
              }
            },
          },
        });
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {!isAddingAccount && (
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {mode === 'signup' ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-gray-400 text-sm">
            {mode === 'signup'
              ? 'Enter your email below to create your account'
              : 'Enter your email below to sign in to your account'}
          </p>
        </div>
      )}

      <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === 'signin' && (
              <Button
                variant="text"
                onClick={() => router.push('/reset-password')}
                disabled={isPending}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? `${mode === 'signup' ? 'Creating account...' : 'Signing in...'}`
            : mode === 'signup'
              ? 'Create account'
              : 'Sign in'}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="text"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          disabled={isPending}
          className="text-sm text-gray-400 hover:text-white"
        >
          {mode === 'signup'
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </Button>
      </div>
    </div>
  );
}
