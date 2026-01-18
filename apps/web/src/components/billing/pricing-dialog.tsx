'use client';

import {
  Dialog,
  DialogContent,
} from '@bounty/ui/components/dialog';
import { useBilling } from '@/hooks/use-billing';
import { Check, Info, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  PRICING_TIERS,
  calculateBountyCost,
  getRecommendedPlan,
  type BountyProPlan,
} from '@bounty/types';
import { cn } from '@bounty/ui';

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPEND_PRESETS = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];

const ALL_FEATURES = [
  { key: 'concurrent', label: 'Concurrent Bounties' },
  { key: 'allowance', label: 'Fee-Free Allowance' },
  { key: 'fee', label: 'Platform Fee' },
  { key: 'support', label: 'Priority Support' },
];

type FeatureKey = 'concurrent' | 'allowance' | 'fee' | 'support';

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${amount}`;
}

function getFeatureValue(plan: BountyProPlan, feature: FeatureKey): string {
  const pricing = PRICING_TIERS[plan];

  switch (feature) {
    case 'concurrent':
      return pricing.concurrentBounties === -1 ? 'Unlimited' : `${pricing.concurrentBounties}`;
    case 'allowance':
      return pricing.feeFreeAllowance === 0 ? 'None' : formatCurrency(pricing.feeFreeAllowance);
    case 'fee':
      return `${pricing.platformFeePercent}%`;
    case 'support':
      return plan === 'free' ? 'Standard' : plan === 'tier_3_pro_plus' ? '24/7 Dedicated' : 'Priority';
    default:
      return '-';
  }
}

function PricingCard({
  plan,
  monthlySpend,
  isRecommended,
  isSelected,
  onSelect,
}: {
  plan: BountyProPlan;
  monthlySpend: number;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const pricing = PRICING_TIERS[plan];
  const costs = calculateBountyCost(pricing, monthlySpend);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex w-[220px] flex-col items-center gap-4 rounded-2xl border p-5 text-center transition-all duration-300',
        isSelected
          ? 'border-blue-500 bg-blue-500/10 shadow-xl shadow-blue-500/20'
          : 'border-gray-700 bg-zinc-900/50 hover:border-gray-600 hover:bg-zinc-900/80',
        isRecommended && !isSelected && 'border-purple-500/50 bg-purple-500/5',
        plan === 'free' && 'opacity-70'
      )}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          <Sparkles className="h-3 w-3" />
          Recommended
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-xl font-bold text-white">{pricing.name}</h3>

      {/* Price */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-white">
          ${pricing.monthlyPrice}
        </span>
        <span className="text-sm text-gray-400">/month</span>
      </div>

      {/* CTA */}
      <div
        className={cn(
          'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
          isSelected
            ? 'bg-blue-500 text-white'
            : isRecommended
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
        )}
      >
        {isSelected ? 'Selected' : plan === 'free' ? 'Current' : 'Upgrade'}
      </div>

      {/* Features */}
      <div className="w-full space-y-3 text-left">
        {ALL_FEATURES.map((feature) => {
          const value = getFeatureValue(plan, feature.key as FeatureKey);
          return (
            <div key={feature.key} className="flex items-center gap-2 text-sm">
              <Check className={cn(
                'h-4 w-4 shrink-0',
                plan === 'free' ? 'text-gray-500' : 'text-green-500'
              )} />
              <span className="flex-1 text-gray-400">{feature.label}</span>
              <span className="font-semibold text-white">{value}</span>
            </div>
          );
        })}
      </div>

      {/* Cost Preview for selected plan */}
      {isSelected && monthlySpend > 0 && plan !== 'free' && (
        <div className="w-full rounded-xl bg-black/40 p-3">
          <div className="mb-2 flex justify-between text-xs text-gray-400">
            <span>Monthly fee</span>
            <span className="text-white">${pricing.monthlyPrice}</span>
          </div>
          <div className="mb-2 flex justify-between text-xs text-gray-400">
            <span>Platform fee</span>
            <span className="text-white">${costs.platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 text-sm font-semibold">
            <span className="text-gray-300">Est. total</span>
            <span className="text-white">${costs.total.toFixed(2)}/mo</span>
          </div>
        </div>
      )}
    </button>
  );
}

function SpendSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const min = 0;
  const max = Math.log(50000);
  const logValue = value > 0 ? Math.log(value) : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    const logValue = Math.exp(newValue);
    onChange(Math.max(0, Math.round(logValue)));
  };

  const percentage = ((logValue - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Slider Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Info className="h-4 w-4 text-blue-400" />
          <span>Expected monthly bounty spend</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">
            {formatCurrency(value)}
          </span>
        </div>
      </div>

      {/* Custom Slider */}
      <div className="relative h-2 w-full">
        {/* Track Background */}
        <div className="absolute inset-0 h-full rounded-full bg-gray-800" />

        {/* Gradient Fill */}
        <div
          className="absolute left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
          style={{ width: `${Math.max(8, percentage)}%` }}
        />

        {/* Invisible Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 200}
          value={logValue}
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-lg transition-all"
          style={{ left: `calc(${Math.max(0, Math.min(100, percentage))}% - 10px)` }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-50" />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {SPEND_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
              value === preset
                ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'border-gray-700 bg-zinc-900/50 text-gray-400 hover:border-gray-600 hover:text-white'
            )}
          >
            {formatCurrency(preset)}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-gray-500">
        Platform fees only apply on amounts exceeding your fee-free allowance
      </p>
    </div>
  );
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const { checkout } = useBilling();
  const [monthlySpend, setMonthlySpend] = useState(2500);
  const [selectedPlan, setSelectedPlan] = useState<BountyProPlan | null>(null);

  const recommendedPlan = getRecommendedPlan(monthlySpend);
  const plans: BountyProPlan[] = [
    'free',
    'tier_1_basic',
    'tier_2_pro',
    'tier_3_pro_plus',
  ];

  const handleUpgrade = async (plan: BountyProPlan) => {
    if (plan === 'free') {
      onOpenChange(false);
      return;
    }

    try {
      await checkout(plan);
      toast.success('Redirecting to checkout...');
      onOpenChange(false);
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl overflow-hidden border-gray-700 bg-zinc-950 p-0">
        {/* Header with Gradient */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30" />
          <div className="-right-20 -top-52 absolute h-auto w-full bg-gradient-to-br from-blue-600/40 to-purple-600/40 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-32 w-full overflow-hidden">
              <Image
                alt="Bounty Pro"
                src="https://pbs.twimg.com/profile_banners/1839004015215161345/1735487023/1500x500"
                fill
                className="object-cover opacity-50"
              />
            </div>
          </div>

          <div className="absolute inset-0 flex items-end justify-center pb-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                Upgrade to Bounty Pro
              </h2>
              <p className="text-sm text-gray-300">
                Scale your bounty operations with powerful features
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Spend Slider */}
          <div className="mb-10">
            <SpendSlider value={monthlySpend} onChange={setMonthlySpend} />
          </div>

          {/* Pricing Cards */}
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {plans.map((plan) => (
              <PricingCard
                key={plan}
                plan={plan}
                monthlySpend={monthlySpend}
                isRecommended={plan === recommendedPlan}
                isSelected={selectedPlan === plan}
                onSelect={() => {
                  if (plan !== selectedPlan) {
                    setSelectedPlan(plan);
                  } else {
                    handleUpgrade(plan);
                  }
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Upgrade or downgrade anytime. No contracts, cancel anytime.</span>
          </div>
        </div>

        {/* Bottom Gradient Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      </DialogContent>
    </Dialog>
  );
}
