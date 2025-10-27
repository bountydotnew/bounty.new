'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { useMutation } from '@tanstack/react-query';
import { useQueryState, parseAsString } from 'nuqs';
import { Suspense, useEffect } from 'react';
import Login from '@/components/bounty/login';
import { trpc } from '@/utils/trpc';

function LoginContent() {
  const [token] = useQueryState('invite', parseAsString);
  
  // Add debugging for tRPC client
  useEffect(() => {
    console.log('[Login] tRPC client state:', {
      hasClient: !!trpc,
      hasUserRouter: !!trpc.user,
      hasApplyInvite: !!trpc.user?.applyInvite,
      hasMutationOptions: !!trpc.user?.applyInvite?.mutationOptions,
    });
  }, []);
  
  const applyInvite = useMutation({
    ...(() => {
      try {
        console.log('[Login] Getting mutationOptions...');
        const options = trpc.user.applyInvite.mutationOptions();
        console.log('[Login] mutationOptions result:', options);
        return options;
      } catch (error) {
        console.error('[Login] Error getting mutationOptions:', error);
        throw error;
      }
    })(),
  });
  useEffect(() => {
    if (token) {
      applyInvite.mutate({ token });
    }
  }, [token, applyInvite]);
  // const handleGitHubSignIn = async () => {
  //   try {
  //     const callbackURL = redirectUrl ? `${redirectUrl}` : `${baseUrl}/dashboard`;

  //     await authClient.signIn.social(
  //       {
  //         provider: "github",
  //         callbackURL
  //       },
  //       {
  //         onSuccess: () => {
  //           toast.success("Sign in successful");
  //         },
  //         onError: (error) => {
  //           toast.error(error.error.message || "Sign in failed");
  //         },
  //       }
  //     );
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Sign in failed");
  //   }
  // };

  return <Login />;
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full bg-landing-background">
      {/* <Header /> */}
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
