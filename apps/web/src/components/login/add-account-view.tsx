'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import AuthForm from '@/components/auth/auth-form';
import Bounty from '@/components/icons/bounty';
import { LINKS } from '@/constants';
import { GithubIcon } from '../icons';

interface AddAccountViewProps {
  callbackUrl: string;
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  };
}

export function AddAccountView({ callbackUrl, session }: AddAccountViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true);

      await authClient.signIn.social(
        {
          provider: 'github',
          callbackURL: '/dashboard',
        },
        {
          onSuccess: () => {
            toast.success('Sign in successful');
            // Refresh the page to show updated sessions list
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
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
    <div className="w-full max-w-96 space-y-8">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
          <Bounty className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">
            Add another account
          </h1>
          <p className="text-gray-400 text-sm">
            You can add another account to switch between them
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3 rounded-lg bg-[#1D1D1D] p-3">
          {session.user.image && (
            <Image
              alt={session.user.name || 'User'}
              className="h-10 w-10 rounded-full"
              height={40}
              src={session.user.image}
              width={40}
            />
          )}
          <div className="text-left">
            <p className="font-medium text-sm text-white">
              {session.user.name}
            </p>
            <p className="text-gray-400 text-xs">
              {session.user.email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <AuthForm callbackUrl={callbackUrl} isAddingAccount={true} />
            
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
          </div>

          <Button
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-gray-400 transition-colors hover:text-gray-200"
            onClick={() => router.push(LINKS.DASHBOARD)}
            variant="text"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

