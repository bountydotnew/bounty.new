import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Loader from "./loader";
import { Button } from "./ui/button";
import { GitHub } from "./icons/github";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInPage } from "./sections/auth/sign-in";

export default function SignInForm({
  onSwitchToSignUp,
  redirectUrl,
}: {
  onSwitchToSignUp: () => void;
  redirectUrl?: string | null;
}) {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    try {
      const callbackURL = redirectUrl || "http://localhost:3001/dashboard";

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

  return (
        <div className="bg-background text-foreground">
          <SignInPage
            heroImageSrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAs_TDUTeHiZQ1tqLJlvItaBOjcmRTeoSbHw&s"
            onSignIn={handleGitHubSignIn}
            onGitHubSignIn={handleGitHubSignIn}
            onResetPassword={() => {}}
            onCreateAccount={() => {}}
          />
        </div>
  );
}
