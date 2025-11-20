'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { LINKS } from '@/constants';
import { LoginSection } from './login-section';
import { LoginShowcase } from './login-showcase';

export default function LoginPageClient() {
  const [callbackParam] = useQueryState('callback', parseAsString);
  const callbackUrl = callbackParam || LINKS.DASHBOARD;

  return (
    <div className="flex min-h-screen flex-col bg-[#111110] text-[#f3f3f3] md:flex-row">
      <LoginSection callbackUrl={callbackUrl} />
      <LoginShowcase />
    </div>
  );
}

