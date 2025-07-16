"use client"

import SignInForm from "@/components/sign-in-form";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setRedirectUrl(searchParams.get("redirect"));
  }, [searchParams]);

  return (
    <SignInForm 
      redirectUrl={redirectUrl}
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
