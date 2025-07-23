"use client"

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { baseUrl } from "@/lib/constants";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Login from "@/components/bounty/login";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  
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

  return (
    <Login/>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-landing-background mx-auto w-full">
      {/* <Header /> */}
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
