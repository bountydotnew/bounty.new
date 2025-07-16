"use client"

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

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
