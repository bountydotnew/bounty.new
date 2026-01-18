'use client';

interface MarketDataProps {
  marketCap: number;
  volume24h: number;
  liquidity: number;
  price: number;
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
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      {/* Market Overview */}
      <div>
        <div className="mb-6">
          <h2 className="mb-2 font-display text-2xl tracking-tight text-[#efefef]">
            Market Overview
          </h2>
          <p className="text-[15px] text-[#666]">
            Comparative view of key market metrics
          </p>
        </div>

        <div className="rounded-xl border border-[#222] bg-[#111] p-6">
          <div className="space-y-6">
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
      </div>

      {/* Health Metrics */}
      <div>
        <div className="mb-6">
          <h2 className="mb-2 font-display text-2xl tracking-tight text-[#efefef]">
            Health Metrics
          </h2>
          <p className="text-[15px] text-[#666]">Key ratios and indicators</p>
        </div>

        <div className="space-y-4">
          <MetricCard
            title="Liquidity Ratio"
            value={`${liquidityRatio}%`}
            subtitle="Liquidity as % of market cap"
            isGood={Number(liquidityRatio) >= 5}
          />
          <MetricCard
            title="Volume/Liquidity"
            value={`${volumeToLiquidity}%`}
            subtitle="Daily volume vs liquidity"
            isGood={Number(volumeToLiquidity) >= 10}
          />
          <MetricCard
            title="Current Price"
            value={formatPrice(price)}
            subtitle={`At ${formatPrice(price)} per token`}
          />
        </div>

        {/* Status Indicators */}
        <div className="mt-6 rounded-xl border border-[#222] bg-[#111] p-5">
          <p className="mb-3 text-[14px] font-medium text-[#efefef]">
            Market Status
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatusIndicator
              label="Liquidity"
              isPositive={Number(liquidityRatio) >= 5}
            />
            <StatusIndicator
              label="Activity"
              isPositive={Number(volumeToLiquidity) >= 10}
            />
            <StatusIndicator label="Market Cap" isPositive={marketCap > 0} />
            <StatusIndicator label="Volume" isPositive={volume24h > 0} />
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
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#efefef]">{label}</span>
        <span className="text-[14px] text-[#888]">{formatCurrency(value)}</span>
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

function MetricCard({
  title,
  value,
  subtitle,
  isGood,
}: {
  title: string;
  value: string;
  subtitle: string;
  isGood?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4">
      <div className="h-3 w-3 rounded-full bg-[#666]" />
      <div className="flex-1">
        <p className="text-[13px] text-[#666]">{title}</p>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg font-medium text-[#efefef]">
            {value}
          </p>
          {isGood !== undefined && (
            <span
              className={`h-2 w-2 rounded-full ${
                isGood ? 'bg-[#efefef]' : 'bg-[#666]'
              }`}
            />
          )}
        </div>
        <p className="text-[12px] text-[#666]">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusIndicator({
  label,
  isPositive,
}: {
  label: string;
  isPositive: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          isPositive ? 'bg-[#efefef]' : 'bg-[#666]'
        }`}
      />
      <span className="text-[13px] text-[#666]">{label}</span>
    </div>
  );
}
