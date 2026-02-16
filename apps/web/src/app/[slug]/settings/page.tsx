'use client';

import { useParams, redirect } from 'next/navigation';

export default function SettingsRedirectPage() {
  const params = useParams();
  const slug = params.slug as string;
  redirect(`/${slug}/settings/account`);
}
