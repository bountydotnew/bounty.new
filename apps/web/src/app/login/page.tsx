"use client"

import { Suspense } from "react";
import { SignInPage } from "@/components/sections/auth/sign-in";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { baseUrl } from "@/lib/constants";

function LoginContent() {
  const handleGitHubSignIn = async () => {
    try {
      const callbackURL = `${baseUrl}/dashboard`;

      await authClient.signIn.social(
        {
          provider: "github",
          callbackURL
        },
        {
          onSuccess: () => {
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || "Sign in failed");
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  return (
    <SignInPage
      onSignIn={handleGitHubSignIn}
      onGitHubSignIn={handleGitHubSignIn}
      onResetPassword={() => { }}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
