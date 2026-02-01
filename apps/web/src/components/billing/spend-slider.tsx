'use client';

import { useMemo, useState } from 'react';
import {
  getRecommendedPlan,
  PRICING_TIERS,
} from '@bounty/types';
import { formatBillingCurrency, parseInputValue, stringifyValue } from '@bounty/ui/lib/utils';

// Slider stops for better UX (non-linear scale for large values)
const SLIDER_STOPS = [
  0, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10_000,
  15_000, 20_000, 25_000, 35_000, 50_000, 75_000, 100_000,
];

function getValueFromSliderPosition(position: number): number {
  const index = Math.round((position / 100) * (SLIDER_STOPS.length - 1));
  return SLIDER_STOPS[Math.min(index, SLIDER_STOPS.length - 1)] ?? 0;
}

interface SpendSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function SpendSlider({ value, onChange }: SpendSliderProps) {
  const [inputValue, setInputValue] = useState(stringifyValue(value));
  const [isFocused, setIsFocused] = useState(false);

  const sliderPosition = useMemo(() => {
    const index = SLIDER_STOPS.findIndex((stop) => stop >= value);
    if (index === -1) return 100;
    if (index === 0) return 0;
    return (index / (SLIDER_STOPS.length - 1)) * 100;
  }, [value]);

  const handleSliderChange = (position: number) => {
    const newValue = getValueFromSliderPosition(position);
    onChange(newValue);
    setInputValue(stringifyValue(newValue));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseInputValue(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
      setInputValue(stringifyValue(parsed));
    } else {
      setInputValue(stringifyValue(value));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const recommendedPlan = getRecommendedPlan(value);
  const needsEnterprise = value > 12_000;

  return (
    <div className="py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">Estimated monthly spend</p>

        <div className="flex items-center gap-3 flex-1 sm:max-w-md">
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
              [&::-webkit-slider-runnable-track]:bg-surface-hover
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
              [&::-moz-range-track]:bg-surface-hover
              [&::-moz-range-thumb]:h-3.5
              [&::-moz-range-thumb]:w-3.5
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:bg-white"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground">
              $
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={isFocused ? inputValue : formatBillingCurrency(value).replace('$', '')}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleInputKeyDown}
              className="w-24 h-8 pl-6 pr-2 text-sm font-medium text-foreground text-right bg-surface-1 border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-border-default focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Recommendation text */}
      <p className="mt-3 text-sm text-text-muted">
        {needsEnterprise ? (
          <>
            Enterprise plans coming soon.{' '}
            <a
              href="mailto:support@bounty.new?subject=Enterprise%20Plan%20Interest"
              className="underline hover:text-text-muted transition-colors"
            >
              Contact us
            </a>
          </>
        ) : (
          <>
            Recommended:{' '}
            <span className="text-text-muted">
              {PRICING_TIERS[recommendedPlan].name}
            </span>
            {recommendedPlan !== 'free' && (
              <span className="text-text-muted">
                {' '}
                —{' '}
                {formatBillingCurrency(
                  PRICING_TIERS[recommendedPlan].feeFreeAllowance
                )}
                /mo platform fee-free
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
