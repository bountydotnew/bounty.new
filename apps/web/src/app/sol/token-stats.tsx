'use client';

import {
  formatCompactCurrency,
  formatCompactNumber,
} from '@bounty/ui/lib/utils';

interface TokenStatsProps {
  marketCap: number;
  volume24h: number;
  volumeChange24h: number;
  liquidity: number;
  supply: number;
  holders: number;
}

export function TokenStats({
  marketCap,
  volume24h,
  volumeChange24h,
  liquidity,
  supply,
  holders,
}: TokenStatsProps) {
  const volMcapRatio =
    marketCap > 0 ? ((volume24h / marketCap) * 100).toFixed(2) : '0';

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-medium text-white">Token Metrics</h2>
        <p className="text-sm text-[#888]">Key statistics and market data</p>
      </div>

      <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm text-[#888]">
          <div>Market Cap</div>
          <div>24h Volume</div>
          <div>Liquidity</div>
          <div>Supply</div>
          <div>Holders</div>
          <div>Vol/MCap</div>
        </div>

        {/* Table row */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-t border-[#2a2a2a] items-center text-sm">
          <div className="text-white font-medium">
            {formatCompactCurrency(marketCap)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {formatCompactCurrency(volume24h)}
            </span>
            {volumeChange24h !== 0 && (
              <span
                className={`text-xs ${
                  volumeChange24h > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {volumeChange24h > 0 ? '+' : ''}
                {volumeChange24h.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-white font-medium">
            {formatCompactCurrency(liquidity)}
          </div>
          <div className="text-white font-medium">
            {formatCompactNumber(supply)}
          </div>
          <div className="text-white font-medium">
            {formatCompactNumber(holders)}
          </div>
          <div className="text-white font-medium">{volMcapRatio}%</div>
        </div>
      </div>
    </div>
  );
}
