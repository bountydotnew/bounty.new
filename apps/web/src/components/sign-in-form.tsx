import { authClient } from "@bounty/auth/client";
import { toast } from "sonner";
import Loader from "./loader";
import { useState } from "react";
import { SignInPage } from "./sections/auth/sign-in";
import { baseUrl } from "@/lib/constants";

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
          provider: "github",
          callbackURL,
        },
        {
          onSuccess: () => {
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || "Sign in failed");
            setIsSigningIn(false);
          },
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
      setIsSigningIn(false);
    }
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        onSignIn={handleGitHubSignIn}
        onGitHubSignIn={handleGitHubSignIn}
        onResetPassword={() => {}}
      />
    </div>
  );
}
