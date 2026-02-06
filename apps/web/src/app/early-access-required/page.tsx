'use client';
import Link from '@bounty/ui/components/link';
import { Button } from '@bounty/ui/components/button';
import { Logo } from '@/components/landing/logo';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useSessionHook } from '@/context/session-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EarlyAccessRequiredPage() {
  const sessionHook = useSessionHook();
  const router = useRouter();
  const { data: session, isPending, refetch } = sessionHook;

  // If user gains access, redirect to dashboard
  useEffect(() => {
    const userRole = session?.user?.role ?? 'user';
    if (userRole === 'early_access' || userRole === 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleCheckStatus = async () => {
    await refetch();
    // After refetch, the useEffect will handle redirect if role changed
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12 sm:px-8">
          <div className="w-full max-w-md text-center">
            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <Logo className="h-16 w-16 text-foreground" />
            </div>

            {/* Heading */}
            <h1 className="mb-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Early Access Required
            </h1>

            {/* Description */}
            <p className="mb-10 text-base leading-relaxed text-text-muted sm:text-lg">
              We&apos;re gradually rolling out access to bounty.new. Join the
              waitlist to be among the first to use Bounty!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={handleCheckStatus}
                disabled={isPending}
                className="rounded-full px-6"
              >
                {isPending ? 'Checking...' : 'Check Status'}
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full"
              >
                <Link href="/">Back Home</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-text-muted">
              Already joined the waitlist? Click &quot;Check Status&quot; to see if you have access.
            </p>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
