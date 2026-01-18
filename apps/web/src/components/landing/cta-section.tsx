'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function CTASection() {
  const router = useRouter();
  const pathname = usePathname();

  const handleCreateBounty = () => {
    const isOnDashboard = pathname === '/dashboard';
    if (isOnDashboard) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.location.hash = '#focus-textarea';
      setTimeout(() => {
        const event = new CustomEvent('focus-textarea');
        window.dispatchEvent(event);
      }, 300);
    } else {
      router.push('/dashboard#focus-textarea');
    }
  };

  return (
    <section className="py-24 px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-light tracking-tight text-[#efefef] md:text-5xl">
          Ship faster. Pay on completion.
        </h2>
        <p className="mt-6 text-lg text-[#888] leading-relaxed">
          Create bounties for your projects and only pay when work is done.
          Let developers compete to solve your problems.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCreateBounty}
            className="inline-flex items-center justify-center bg-white text-[#0E0E0E] rounded-full text-sm font-medium hover:bg-[#e5e5e5] transition-colors"
            style={{ padding: '.5em 1.25em .52em' }}
          >
            Create a Bounty
          </button>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#252525] transition-colors border border-[#333]"
            style={{ padding: '.5em 1.25em .52em' }}
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
