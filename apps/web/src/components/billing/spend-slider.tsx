'use client';

import { useMemo } from 'react';
import { getRecommendedPlan, PRICING_TIERS, type BountyProPlan } from '@bounty/types';

// Slider stops for better UX (non-linear scale for large values)
const SLIDER_STOPS = [
  0, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
  15000, 20000, 25000, 35000, 50000, 75000, 100000,
];

function getValueFromSliderPosition(position: number): number {
  const index = Math.round((position / 100) * (SLIDER_STOPS.length - 1));
  return SLIDER_STOPS[Math.min(index, SLIDER_STOPS.length - 1)] ?? 0;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${amount}`;
}

interface SpendSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function SpendSlider({ value, onChange }: SpendSliderProps) {
  const sliderPosition = useMemo(() => {
    const index = SLIDER_STOPS.findIndex((stop) => stop >= value);
    if (index === -1) return 100;
    if (index === 0) return 0;
    return (index / (SLIDER_STOPS.length - 1)) * 100;
  }, [value]);

  const handleSliderChange = (position: number) => {
    onChange(getValueFromSliderPosition(position));
  };

  const recommendedPlan = getRecommendedPlan(value);
  const needsEnterprise = value > 12000;

  return (
    <div className="py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#888]">
          Estimated monthly spend
        </p>
        
        <div className="flex items-center gap-4 flex-1 sm:max-w-md">
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={sliderPosition}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="flex-1 cursor-pointer appearance-none bg-transparent
              [&::-webkit-slider-runnable-track]:h-1 
              [&::-webkit-slider-runnable-track]:rounded-full 
              [&::-webkit-slider-runnable-track]:bg-[#2a2a2a]
              [&::-webkit-slider-thumb]:mt-[-6px]
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-track]:h-1
              [&::-moz-range-track]:rounded-full
              [&::-moz-range-track]:bg-[#2a2a2a]
              [&::-moz-range-thumb]:h-3.5
              [&::-moz-range-thumb]:w-3.5
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:bg-white"
          />
          <span className="text-sm font-medium text-[#efefef] w-16 text-right">
            {formatCurrency(value)}
          </span>
        </div>
      </div>
      
      {/* Recommendation text */}
      <p className="mt-3 text-sm text-[#666]">
        {needsEnterprise ? (
          <>
            Enterprise plans coming soon.{' '}
            <a
              href="mailto:support@bounty.new?subject=Enterprise%20Plan%20Interest"
              className="underline hover:text-[#888] transition-colors"
            >
              Contact us
            </a>
          </>
        ) : (
          <>
            Recommended: <span className="text-[#888]">{PRICING_TIERS[recommendedPlan].name}</span>
            {recommendedPlan !== 'free' && (
              <span className="text-[#666]"> — {formatCurrency(PRICING_TIERS[recommendedPlan].feeFreeAllowance)} fee-free</span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
