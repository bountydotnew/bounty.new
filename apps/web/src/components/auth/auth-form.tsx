'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthFormProps {
  callbackUrl?: string;
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

export default function AuthForm({ callbackUrl }: AuthFormProps) {
  // Validate and sanitize the callback URL to prevent open redirects
  const safeCallbackUrl: string = isSafeRedirectUrl(callbackUrl) && callbackUrl ? callbackUrl : '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();

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
            onError: (ctx: { error: { message?: string; status?: number } }) => {
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
                
                toast.success('Account created! Please check your email to sign in.');
                router.push(`/sign-up/verify-email-address?email=${encodeURIComponent(email)}`);
              } catch (error) {
                toast.error('Failed to send verification code. Please try again.');
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
            onError: (ctx: { error: { message?: string; status?: number } }) => {
              if (ctx.error.status === 403) {
                toast.error('Please verify your email address before signing in');
                router.push(`/sign-up/verify-email-address?email=${encodeURIComponent(email)}`);
              } else {
                toast.error(ctx.error.message || 'Sign in failed');
              }
            },
            onSuccess: () => {
              toast.success('Sign in successful');
              window.location.href = safeCallbackUrl;
            },
          },
        });
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
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
          <Label htmlFor="password">Password</Label>
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

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
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