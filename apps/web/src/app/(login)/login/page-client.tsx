'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { useQuery, skipToken } from '@tanstack/react-query';
import { useQueryState, parseAsString } from 'nuqs';
import { Suspense } from 'react';
import LoginPageClient from '@/components/login/login.page.client';
import { trpcClient } from '@/utils/trpc';

function LoginContent() {
  const [token] = useQueryState('invite', parseAsString);

  // Apply invite token via useQuery — fires automatically when token is present
  useQuery({
    queryKey: ['applyInvite', token],
    queryFn: token
      ? () => trpcClient.user.applyInvite.mutate({ token })
      : skipToken,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
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

  return <LoginPageClient />;
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
