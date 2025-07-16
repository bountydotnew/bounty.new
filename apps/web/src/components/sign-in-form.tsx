import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Loader from "./loader";
import { useState } from "react";
import { SignInPage } from "./sections/auth/sign-in";
import { SignUpPage } from "./sections/auth/sign-up";
import { baseUrl } from "@/lib/constants";

export default function SignInForm({
  onSwitchToSignUp,
  redirectUrl,
}: {
  onSwitchToSignUp: () => void;
  redirectUrl?: string | null;
}) {
  const { isPending } = authClient.useSession();
  const  [, setIsSigningIn] = useState(false);

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    try {
      const callbackURL = redirectUrl || `${baseUrl}/dashboard`;

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
            setIsSigningIn(false);
          },
        }
      );
    } catch (error) {
      toast.error("Sign in failed");
      setIsSigningIn(false);
    }
  };

  if (isPending) {
    return <Loader />;
  }
  if (!onSwitchToSignUp) {
    return <SignUpPage
      onSignUp={() => {}}
      onGitHubSignUp={handleGitHubSignIn}
      onResetPassword={() => {}}
      onCreateAccount={() => {}}
      onSwitchToSignUp={() => {}}
    />;
  }
  return (
        <div className="bg-background text-foreground">
          <SignInPage
            heroImageSrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAs_TDUTeHiZQ1tqLJlvItaBOjcmRTeoSbHw&s"
            onSignIn={handleGitHubSignIn}
            onGitHubSignIn={handleGitHubSignIn}
            onSwitchToSignUp={onSwitchToSignUp}
            onResetPassword={() => {}}  
            onCreateAccount={onSwitchToSignUp}
          />
        </div>
  );
}
