import { authClient } from '@bounty/auth/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { baseUrl } from '@/lib/constants';
import Loader from './loader';
import { SignInPage } from './sections/auth/sign-in';

export default function SignInForm({
  redirectUrl,
}: {
  redirectUrl?: string | null;
}) {
  const { isPending } = authClient.useSession();
  const [, setIsSigningIn] = useState(false);

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    try {
      const callbackURL = redirectUrl || `${baseUrl}/dashboard`;

      await authClient.signIn.social(
        {
          provider: 'github',
          callbackURL,
        },
        {
          onSuccess: () => {
            toast.success('Sign in successful');
          },
          onError: (error) => {
            toast.error(error.error.message || 'Sign in failed');
            setIsSigningIn(false);
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed');
      setIsSigningIn(false);
    }
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        onGitHubSignIn={handleGitHubSignIn}
        onResetPassword={() => {}}
        onSignIn={handleGitHubSignIn}
      />
    </div>
  );
}
