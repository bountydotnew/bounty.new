'use client';

import {
  TrendingUp,
  DollarSign,
  Droplets,
  Users,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

interface SolHeroProps {
  price: number;
  priceChange24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  symbol: string;
  name: string;
}

function formatCurrency(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function formatPrice(num: number): string {
  if (num < 0.0001) {
    return `$${num.toFixed(8)}`;
  }
  if (num < 0.01) {
    return `$${num.toFixed(6)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(4)}`;
  }
  return `$${num.toFixed(2)}`;
}

const CONTRACT_ADDRESS = 'GZj4qMQFtwPpStknSaisn7shPJJ7Dv7wsuksEborBAGS';

export function SolHero({
  price,
  priceChange24h,
  marketCap,
  liquidity,
  holders,
  symbol,
  name,
}: SolHeroProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-display text-5xl tracking-tight text-[#efefef] md:text-6xl">
          ${symbol}
        </h1>
        <p className="mx-auto max-w-xl text-lg text-[#888]">
          Real-time market data for {name} on Solana
        </p>

        {/* Contract Address */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#222] bg-[#111] px-4 py-2.5 font-mono text-[14px] text-[#666]">
            <span className="hidden sm:inline">CA:</span>
            <span className="max-w-[160px] truncate sm:max-w-none">
              {CONTRACT_ADDRESS}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              className="text-[#666] transition-colors duration-150 hover:text-[#efefef]"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#efefef]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <a
              href={`https://bags.fm/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#666] transition-colors duration-150 hover:text-[#efefef]"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Live Price */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="font-display text-4xl font-medium text-[#efefef] md:text-5xl">
            {formatPrice(price)}
          </span>
          <span
            className={`text-[14px] font-medium ${
              priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {priceChange24h >= 0 ? '+' : ''}
            {priceChange24h.toFixed(2)}%
          </span>
        </div>
        <p className="mt-2 text-center text-[14px] text-[#666]">24h Change</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Price"
          value={formatPrice(price)}
          description="Current price"
          change={priceChange24h}
        />
        <StatCard
          icon={TrendingUp}
          label="Market Cap"
          value={formatCurrency(marketCap)}
          description="Fully diluted"
        />
        <StatCard
          icon={Droplets}
          label="Liquidity"
          value={formatCurrency(liquidity)}
          description="DEX liquidity"
        />
        <StatCard
          icon={Users}
          label="Holders"
          value={formatNumber(holders)}
          description="Token holders"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  change,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  change?: number;
}) {
  return (
    <div className="group rounded-xl border border-transparent px-5 py-5 text-center transition-all duration-200 hover:border-[#222] hover:bg-[#111]">
      <Icon className="mx-auto mb-3 h-6 w-6 text-[#666] transition-colors duration-200 group-hover:text-[#888]" />
      <div className="flex items-center justify-center gap-2">
        <span className="font-display text-2xl font-medium text-[#efefef]">
          {value}
        </span>
        {change !== undefined && change !== 0 && (
          <span
            className={`text-[12px] font-medium ${
              change > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-[15px] font-medium text-[#efefef]">{label}</p>
      <p className="text-[14px] text-[#666]">{description}</p>
    </div>
  );
}
