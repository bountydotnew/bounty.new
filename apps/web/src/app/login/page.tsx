"use client"

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setRedirectUrl(searchParams.get("redirect"));
  }, [searchParams]);

  return showSignIn ? (
    <SignInForm 
      onSwitchToSignUp={() => setShowSignIn(false)} 
      redirectUrl={redirectUrl}
    />
  ) : (
    <SignUpForm 
      onSwitchToSignIn={() => setShowSignIn(true)}
      redirectUrl={redirectUrl}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
