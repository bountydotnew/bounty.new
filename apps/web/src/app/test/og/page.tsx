'use client';

import BountyIssueOgCard from '@/components/og/BountyIssueOgCard';

export default function TestOgPage() {
  return (
    <div className="p-6">
      <div className="mb-4 text-xl">OG Preview</div>
      <div
        className="overflow-hidden rounded-lg border"
        style={{ width: 600, height: 315 }}
      >
        <div
          style={{
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            width: 1200,
            height: 630,
          }}
        >
          <BountyIssueOgCard
            amount="1000"
            currency="USD"
            issueNumber={33}
            owner="bountydotnew"
            repo="bounty.new"
            title="feat: create access gate to manage alphas/betas"
          />
        </div>
      </div>
    </div>
  );
}
