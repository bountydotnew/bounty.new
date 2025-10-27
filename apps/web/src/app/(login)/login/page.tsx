'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { useMutation } from '@tanstack/react-query';
import { useQueryState, parseAsString } from 'nuqs';
import { Suspense, useEffect } from 'react';
import Login from '@/components/bounty/login';
import { trpc, trpcClient } from '@/utils/trpc';

function LoginContent() {
  const [token] = useQueryState('invite', parseAsString);
  
  // Note: Using direct trpcClient.mutate() instead of mutationOptions() 
  // to avoid keyPrefix error in the proxy layer
  
  const applyInvite = useMutation({
    mutationFn: async (input: { token: string }) => {
      return await trpcClient.user.applyInvite.mutate(input);
    },
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
