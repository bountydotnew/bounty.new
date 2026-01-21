'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import {
  formatCompactCurrency,
  formatCompactNumber,
} from '@bounty/ui/lib/utils';

interface TradingActivityProps {
  trades24h: number;
  volume24h: number;
  buyVolume24h: number;
  sellVolume24h: number;
  numTraders24h: number;
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
        <div className="mb-4">
          <h2 className="text-base font-medium text-white">Trading Activity</h2>
          <p className="text-sm text-[#888]">24-hour transaction metrics</p>
        </div>
        <p className="text-sm text-[#888]">
          No trading activity data available
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-medium text-white">Trading Activity</h2>
        <p className="text-sm text-[#888]">24-hour transaction metrics</p>
      </div>

      {/* Activity Stats Table */}
      <div className="rounded-lg border border-[#2a2a2a] overflow-hidden mb-6">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm text-[#888]">
          <div>24h Trades</div>
          <div>24h Volume</div>
          <div>Traders</div>
          <div>Avg Size</div>
        </div>
        <div className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-[#2a2a2a] text-sm">
          <div className="text-white font-medium">
            {formatCompactNumber(trades24h)}
          </div>
          <div className="text-white font-medium">
            {formatCompactCurrency(volume24h)}
          </div>
          <div className="text-white font-medium">
            {formatCompactNumber(numTraders24h)}
          </div>
          <div className="text-white font-medium">
            {formatCompactCurrency(avgTradeSize)}
          </div>
        </div>
      </div>

      {/* Buy/Sell Breakdown */}
      <div className="mb-4">
        <h3 className="text-base font-medium text-white">Volume Breakdown</h3>
      </div>

      <div className="space-y-4">
        <VolumeBar
          label="Buy Volume"
          value={buyVolume24h}
          percentage={buyPercentage}
          icon={ArrowUp}
          color="green"
        />
        <VolumeBar
          label="Sell Volume"
          value={sellVolume24h}
          percentage={sellPercentage}
          icon={ArrowDown}
          color="red"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-[#888]">Buy/Sell Ratio</span>
        <span className="text-white font-medium">{buySellRatio}</span>
      </div>
    </div>
  );
}

function VolumeBar({
  label,
  value,
  percentage,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red';
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${color === 'green' ? 'text-green-400' : 'text-red-400'}`}
          />
          <span className="text-[#888]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {formatCompactCurrency(value)}
          </span>
          <span className="text-[#888]">({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === 'green' ? 'bg-green-400' : 'bg-red-400'
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
