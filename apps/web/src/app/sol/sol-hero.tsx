'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import {
  formatCompactNumber,
  formatPrecisionPrice,
} from '@bounty/ui/lib/utils';
import { Logo } from '@/components/landing/logo';

interface SolHeroProps {
  price: number;
  priceChange24h: number;
  symbol: string;
}

const CONTRACT_ADDRESS = 'GZj4qMQFtwPpStknSaisn7shPJJ7Dv7wsuksEborBAGS';
const PRO_MONTHLY_PRICE = 25;

export function SolHero({ price, priceChange24h, symbol }: SolHeroProps) {
  // Calculate tokens needed for 1 month of Pro ($25)
  const tokensForPro = price > 0 ? Math.ceil(PRO_MONTHLY_PRICE / price) : 0;

  return (
    <section className="py-24 px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[#efefef] md:text-5xl">
          Hold ${symbol}, get Pro free
        </h1>
        <p className="mt-6 text-lg text-[#888] leading-relaxed">
          Token holders get 1 month of{' '}
          <span className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#333] rounded-full pl-1.5 pr-2.5 py-0.5 text-white text-sm font-medium">
            <Logo className="h-4 w-4" />
            Bounty Pro
            <span className="text-[#888] text-xs">$25</span>
          </span>{' '}
          for free. Hold{' '}
          <a
            href={`https://phantom.com/tokens/solana/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#333] rounded-full px-2.5 py-0.5 text-white text-sm font-medium hover:bg-[#252525] transition-colors"
          >
            {formatCompactNumber(tokensForPro)} ${symbol}
            <span className="text-[#888] text-xs">${PRO_MONTHLY_PRICE}</span>
          </a>{' '}
          to unlock unlimited bounties, priority support, and zero platform
          fees.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard?claim=sol"
            className="inline-flex items-center justify-center bg-white text-[#0E0E0E] rounded-full text-sm font-medium hover:bg-[#e5e5e5] transition-colors"
            style={{ padding: '.5em 1.25em .52em' }}
          >
            Claim Pro Access
          </Link>
          <a
            href={`https://phantom.com/tokens/solana/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#252525] transition-colors border border-[#333]"
            style={{ padding: '.5em 1.25em .52em' }}
          >
            Buy ${symbol}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        {/* Current price indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm">
          <span className="text-[#888]">Current price:</span>
          <span className="text-white font-medium">
            {formatPrecisionPrice(price)}
          </span>
          <span
            className={`${
              priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {priceChange24h >= 0 ? '+' : ''}
            {priceChange24h.toFixed(2)}%
          </span>
          <span className="text-[#555]">·</span>
          <Link
            href="/sol/metrics"
            className="text-[#888] hover:text-white transition-colors underline underline-offset-2"
          >
            View metrics
          </Link>
        </div>
      </div>
    </section>
  );
}
