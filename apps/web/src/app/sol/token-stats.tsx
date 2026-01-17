'use client';

import {
  TrendingUp,
  BarChart3,
  Droplets,
  Coins,
  Users,
  Percent,
} from 'lucide-react';

interface TokenStatsProps {
  marketCap: number;
  volume24h: number;
  volumeChange24h: number;
  liquidity: number;
  supply: number;
  holders: number;
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
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function TokenStats({
  marketCap,
  volume24h,
  volumeChange24h,
  liquidity,
  supply,
  holders,
}: TokenStatsProps) {
  const volMcapRatio = marketCap > 0 ? ((volume24h / marketCap) * 100).toFixed(2) : '0';

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 font-display text-2xl tracking-tight text-[#efefef]">
          Token Metrics
        </h2>
        <p className="text-[15px] text-[#666]">Key statistics and market data</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={TrendingUp}
          label="Market Cap"
          value={formatCurrency(marketCap)}
          description="Fully diluted valuation"
        />
        <MetricCard
          icon={BarChart3}
          label="24h Volume"
          value={formatCurrency(volume24h)}
          description="Trading volume"
          change={volumeChange24h}
        />
        <MetricCard
          icon={Droplets}
          label="Liquidity"
          value={formatCurrency(liquidity)}
          description="Total DEX liquidity"
        />
        <MetricCard
          icon={Coins}
          label="Supply"
          value={formatNumber(supply)}
          description="Total token supply"
        />
        <MetricCard
          icon={Users}
          label="Holders"
          value={formatNumber(holders)}
          description="Unique wallet holders"
        />
        <MetricCard
          icon={Percent}
          label="Vol/MCap Ratio"
          value={`${volMcapRatio}%`}
          description="Volume to market cap"
        />
      </div>
    </div>
  );
}

function MetricCard({
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
    <div className="group flex items-center gap-4 rounded-xl border border-transparent px-5 py-4 transition-all duration-200 hover:border-[#222] hover:bg-[#111]">
      <Icon className="h-7 w-7 text-[#666] transition-colors duration-200 group-hover:text-[#888]" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-medium text-[#efefef]">
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
        <p className="text-[14px] font-medium text-[#efefef]">{label}</p>
        <p className="text-[13px] text-[#666]">{description}</p>
      </div>
    </div>
  );
}
