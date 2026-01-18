"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './logo';
import { CTASection } from './cta-section';
import { FooterFAQ } from './footer-faq';

export function Footer() {
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
    <footer className="border-t border-[#1a1a1a]">
      {/* CTA Section */}
      <CTASection />
      
      {/* FAQ Section */}
      <div className="border-t border-[#1a1a1a]">
        <FooterFAQ />
      </div>
      
      {/* Footer Links */}
      <div className="border-t border-[#1a1a1a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/bounties" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Browse Bounties
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCreateBounty}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create Bounty
                </button>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Developers</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contributors"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  For Devs
                </Link>
              </li>
              <li>
                <a
                  href="https://docs.bounty.new"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Docs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/sol" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Solana
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
              © {new Date().getFullYear()} bounty.new. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/bountydotnew/bounty.new"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://twitter.com/bountydotnew"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Twitter
            </a>
            <a
              href="https://discord.gg/bountydotnew"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </div>
    </footer>
  );
}
