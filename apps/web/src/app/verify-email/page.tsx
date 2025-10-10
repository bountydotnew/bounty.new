import { redirect } from 'next/navigation';

type SearchParams = { [key: string]: string | string[] | undefined };

export default function VerifyEmailProxy({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        usp.append(key, v);
      }
    } else if (typeof value === 'string') {
      usp.set(key, value);
    }
  }
  redirect(`/api/auth/verify-email?${usp.toString()}`);
}