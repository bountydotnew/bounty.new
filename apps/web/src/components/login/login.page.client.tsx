'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { LINKS } from '@/constants';
import { LoginSection } from './login-section';

export default function LoginPageClient() {
  const [callbackParam] = useQueryState('callback', parseAsString);
  const callbackUrl = callbackParam || LINKS.DASHBOARD;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111110] text-[#f3f3f3]">
      <LoginSection callbackUrl={callbackUrl} />
    </div>
  );
}
