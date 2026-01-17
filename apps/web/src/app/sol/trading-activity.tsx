'use client';

import { RefreshCw, BarChart3, Users, Zap, ArrowUp, ArrowDown } from 'lucide-react';

interface TradingActivityProps {
  trades24h: number;
  volume24h: number;
  buyVolume24h: number;
  sellVolume24h: number;
  numTraders24h: number;
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
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function TradingActivity({
  trades24h,
  volume24h,
  buyVolume24h,
  sellVolume24h,
  numTraders24h,
}: TradingActivityProps) {
  const avgTradeSize = trades24h > 0 ? volume24h / trades24h : 0;
  const buyPercentage = volume24h > 0 ? (buyVolume24h / volume24h) * 100 : 50;
  const sellPercentage = volume24h > 0 ? (sellVolume24h / volume24h) * 100 : 50;
  const buySellRatio =
    sellVolume24h > 0 ? (buyVolume24h / sellVolume24h).toFixed(2) : 'N/A';

  if (trades24h === 0 && volume24h === 0) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="mb-2 font-display text-2xl tracking-tight text-[#efefef]">
            Trading Activity
          </h2>
          <p className="text-[15px] text-[#666]">24-hour transaction metrics</p>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-8 text-center">
          <p className="text-[#666]">No trading activity data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 font-display text-2xl tracking-tight text-[#efefef]">
          Trading Activity
        </h2>
        <p className="text-[15px] text-[#666]">24-hour transaction metrics</p>
      </div>

      {/* Activity Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ActivityCard
          icon={RefreshCw}
          title="24h Trades"
          value={formatNumber(trades24h)}
          subtitle="Total DEX trades"
        />
        <ActivityCard
          icon={BarChart3}
          title="24h Volume"
          value={formatCurrency(volume24h)}
          subtitle="Total volume"
        />
        <ActivityCard
          icon={Users}
          title="Traders"
          value={formatNumber(numTraders24h)}
          subtitle="Unique traders"
        />
        <ActivityCard
          icon={Zap}
          title="Avg Size"
          value={formatCurrency(avgTradeSize)}
          subtitle="Per trade"
        />
      </div>

      {/* Buy/Sell Breakdown */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-6">
        <h3 className="mb-4 text-[15px] font-medium text-[#efefef]">
          Volume Breakdown
        </h3>

        <div className="space-y-4">
          <VolumeBar
            label="Buy Volume"
            value={buyVolume24h}
            percentage={buyPercentage}
            icon={ArrowUp}
          />
          <VolumeBar
            label="Sell Volume"
            value={sellVolume24h}
            percentage={sellPercentage}
            icon={ArrowDown}
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#222] pt-4">
          <span className="text-[14px] text-[#666]">Buy/Sell Ratio</span>
          <span className="text-[14px] font-medium text-[#efefef]">
            {buySellRatio}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="group rounded-xl border border-transparent px-5 py-4 transition-all duration-200 hover:border-[#222] hover:bg-[#111]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#222] bg-[#0a0a0a]">
          <Icon className="h-5 w-5 text-[#666]" />
        </div>
        <div>
          <p className="text-[13px] text-[#666]">{title}</p>
          <p className="font-display text-xl font-medium text-[#efefef]">
            {value}
          </p>
          <p className="text-[12px] text-[#666]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function VolumeBar({
  label,
  value,
  percentage,
  icon: Icon,
}: {
  label: string;
  value: number;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#666]" />
          <span className="text-[14px] font-medium text-[#efefef]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-[#888]">
            {formatCurrency(value)}
          </span>
          <span className="text-[13px] text-[#666]">
            ({percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#222]">
        <div
          className="h-full rounded-full bg-[#efefef] transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
