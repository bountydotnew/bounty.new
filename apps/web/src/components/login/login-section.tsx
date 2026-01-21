'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { useSession } from '@/context/session-context';
import { Button } from '@bounty/ui/components/button';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthForm from '@/components/auth/auth-form';
import Bounty from '@/components/icons/bounty';
import { GithubIcon } from '../icons';
import { AddAccountView } from '@/components/login/add-account-view';
import { SignedInView } from '@/components/login/signed-in-view';

interface LoginSectionProps {
  callbackUrl: string;
}

export function LoginSection({ callbackUrl }: LoginSectionProps) {
  const [loading, setLoading] = useState(false);
  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null);
  const [addAccountParam] = useQueryState('addAccount', parseAsString);
  const { session, isPending } = useSession();
  const isAddingAccount = addAccountParam === 'true';

  useEffect(() => {
    try {
      const method =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('bounty-last-login-method')
          : null;
      setLastUsedMethod(method);
    } catch {
      // ignore storage access errors
    }
  }, []);

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true);

      await authClient.signIn.social(
        {
          provider: 'github',
          callbackURL: isAddingAccount ? '/dashboard' : callbackUrl,
        },
        {
          onSuccess: () => {
            toast.success('Sign in successful');
            if (isAddingAccount) {
              // Refresh the page to show updated sessions list
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1000);
            }
          },
          onError: (error) => {
            toast.error(error.error.message || 'Sign in failed');
            setLoading(false);
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center text-[#f3f3f3]">
      <div className="w-full max-w-sm space-y-8">
        {isPending && (
          <div className="w-full space-y-8">
            <div className="animate-pulse space-y-4 text-center">
              <div className="mx-auto h-16 w-16 rounded-lg bg-[#383838]" />
              <div className="mx-auto h-7 w-48 rounded bg-[#383838]" />
            </div>

            <div className="animate-pulse space-y-3">
              <div className="h-12 w-full rounded-lg bg-[#383838]" />
            </div>

            <div className="animate-pulse text-center">
              <div className="mx-auto h-4 w-64 rounded bg-[#383838]" />
            </div>
          </div>
        )}

        {!isPending &&
          session &&
          (isAddingAccount ? (
            <AddAccountView callbackUrl={callbackUrl} session={session} />
          ) : (
            <SignedInView callbackUrl={callbackUrl} session={session} />
          ))}

        {!(isPending || session) && (
          <div className="w-full space-y-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
                <Bounty className="h-12 w-12 text-primary" />
              </div>
              <h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">
                Sign in to bounty
              </h1>
            </div>

            <div className="space-y-6">
              <AuthForm callbackUrl={callbackUrl} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#111110] px-2 text-gray-400">Or</span>
                </div>
              </div>

              <div className="relative">
                <Button
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#2A2A28] py-3 font-medium text-gray-200 transition-colors hover:bg-[#383838]"
                  disabled={loading}
                  onClick={handleGitHubSignIn}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <GithubIcon className="h-5 w-5 fill-white" />
                  )}
                  {loading ? 'Signing in…' : 'Continue with GitHub'}
                </Button>
                {lastUsedMethod === 'github' && (
                  <Badge className="-top-2 -right-2 absolute bg-primary px-1 py-0.5 text-primary-foreground text-xs">
                    Last used
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
