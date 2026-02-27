'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { LINKS } from '@/constants';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import Bounty from '@/components/icons/bounty';
import { GithubIcon } from '../icons';
import GoogleIcon from '../icons/google';

export function SignUpSection() {
  const [loading, setLoading] = useState(false);
  const [lastUsedMethod] = useState<string | null>(() => {
    try {
      return typeof localStorage !== 'undefined'
        ? localStorage.getItem('bounty-last-login-method')
        : null;
    } catch {
      return null;
    }
  });

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social(
        {
          provider: 'github',
          callbackURL: LINKS.DASHBOARD,
        },
        {
          onSuccess: () => {
            toast.success('Account created successfully');
          },
          onError: (error) => {
            toast.error(error.error.message || 'Sign up failed');
            setLoading(false);
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social(
        {
          provider: 'google',
          callbackURL: LINKS.DASHBOARD,
        },
        {
          onSuccess: () => {
            toast.success('Account created successfully');
          },
          onError: (error) => {
            toast.error(error.error.message || 'Sign up failed');
            setLoading(false);
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center text-foreground">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
            <Bounty className="h-12 w-12 text-primary" />
          </div>
          <h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">
            Create your bounty account
          </h1>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Button
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-foreground text-background py-3 font-medium hover:bg-black/80 dark:hover:bg-white/80"
              disabled={loading}
              onClick={handleGitHubSignIn}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-foreground dark:border-white/30 dark:border-t-white" />
              ) : (
                <GithubIcon className="h-5 w-5 fill-background" />
              )}
              {loading ? 'Creating account…' : 'Continue with GitHub'}
            </Button>
            {lastUsedMethod === 'github' && (
              <Badge className="-top-2 -right-2 absolute bg-primary px-1 py-0.5 text-primary-foreground text-xs">
                Last used
              </Badge>
            )}
          </div>

          <div className="relative">
            <Button
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-foreground text-background py-3 font-medium hover:bg-black/80 dark:hover:bg-white/80"
              disabled={loading}
              onClick={handleGoogleSignIn}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-foreground dark:border-white/30 dark:border-t-white" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              {loading ? 'Creating account…' : 'Continue with Google'}
            </Button>
            {lastUsedMethod === 'google' && (
              <Badge className="-top-2 -right-2 absolute bg-primary px-1 py-0.5 text-primary-foreground text-xs">
                Last used
              </Badge>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-foreground transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
