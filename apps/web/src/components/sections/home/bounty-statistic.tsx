import NumberFlow, { type Format } from '@number-flow/react';

interface BountyStatisticProps {
  label: string;
  value: number;
  color: string;
  showDollar?: boolean;
}

export function BountyStatistic({
  label,
  value,
  color,
  showDollar = true,
}: BountyStatisticProps) {
  const format: Format = {
    notation: 'compact',
    compactDisplay: 'short',
    roundingMode: 'trunc',
    style: showDollar ? 'currency' : 'decimal',
    currency: 'USD',
  };

  return (
    <div className="relative min-w-[200px] bg-transparent p-8">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 h-6 w-6 border-border-subtle border-t border-l" />
      <div className="absolute top-0 right-0 h-6 w-6 border-border-subtle border-t border-r" />
      <div className="absolute bottom-0 left-0 h-6 w-6 border-border-subtle border-b border-l" />
      <div className="absolute right-0 bottom-0 h-6 w-6 border-border-subtle border-r border-b" />

      <div className={`mb-2 font-bold text-4xl ${color}`}>
        <NumberFlow
          format={format}
          respectMotionPreference={true}
          value={value}
        />
      </div>
      <div className="text-gray-400">{label}</div>
    </div>
  );
}
