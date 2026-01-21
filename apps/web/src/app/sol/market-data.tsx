'use client';

import {
  formatCompactCurrency,
  formatPrecisionPrice,
} from '@bounty/ui/lib/utils';

interface MarketDataProps {
  marketCap: number;
  volume24h: number;
  liquidity: number;
  price: number;
}

export function MarketData({
  marketCap,
  volume24h,
  liquidity,
  price,
}: MarketDataProps) {
  const liquidityRatio =
    marketCap > 0 ? ((liquidity / marketCap) * 100).toFixed(2) : '0';
  const volumeToLiquidity =
    liquidity > 0 ? ((volume24h / liquidity) * 100).toFixed(2) : '0';
  const maxValue = Math.max(marketCap, volume24h, liquidity);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Market Overview */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-medium text-white">Market Overview</h2>
          <p className="text-sm text-[#888]">
            Comparative view of key market metrics
          </p>
        </div>

        <div className="space-y-4">
          <ProgressBar
            label="Market Cap"
            value={marketCap}
            maxValue={maxValue}
          />
          <ProgressBar
            label="24h Volume"
            value={volume24h}
            maxValue={maxValue}
          />
          <ProgressBar
            label="Liquidity"
            value={liquidity}
            maxValue={maxValue}
          />
        </div>
      </div>

      {/* Health Metrics */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-medium text-white">Health Metrics</h2>
          <p className="text-sm text-[#888]">Key ratios and indicators</p>
        </div>

        <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm text-[#888]">
            <div>Metric</div>
            <div>Value</div>
            <div>Status</div>
          </div>

          {/* Rows */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3 border-t border-[#2a2a2a] items-center text-sm">
            <div className="text-[#888]">Liquidity Ratio</div>
            <div className="text-white font-medium">{liquidityRatio}%</div>
            <div>
              <span
                className={`px-2 py-0.5 rounded-md text-xs ${
                  Number(liquidityRatio) >= 5
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-[#303030] text-[#888]'
                }`}
              >
                {Number(liquidityRatio) >= 5 ? 'Healthy' : 'Low'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 px-4 py-3 border-t border-[#2a2a2a] items-center text-sm">
            <div className="text-[#888]">Volume/Liquidity</div>
            <div className="text-white font-medium">{volumeToLiquidity}%</div>
            <div>
              <span
                className={`px-2 py-0.5 rounded-md text-xs ${
                  Number(volumeToLiquidity) >= 10
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-[#303030] text-[#888]'
                }`}
              >
                {Number(volumeToLiquidity) >= 10 ? 'Active' : 'Low'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 px-4 py-3 border-t border-[#2a2a2a] items-center text-sm">
            <div className="text-[#888]">Current Price</div>
            <div className="text-white font-medium">
              {formatPrecisionPrice(price)}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md text-xs bg-[#303030] text-[#888]">
                Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  maxValue,
}: {
  label: string;
  value: number;
  maxValue: number;
}) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#888]">{label}</span>
        <span className="text-white font-medium">
          {formatCompactCurrency(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
