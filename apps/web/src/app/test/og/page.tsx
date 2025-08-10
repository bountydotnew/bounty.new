"use client";

import BountyIssueOgCard from "@/components/og/BountyIssueOgCard";

export default function TestOgPage() {
  return (
    <div className="p-6">
      <div className="text-xl mb-4">OG Preview</div>
      <div className="border rounded-lg overflow-hidden" style={{ width: 600, height: 315 }}>
        <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: 1200, height: 630 }}>
          <BountyIssueOgCard
            owner="bountydotnew"
            repo="bounty.new"
            issueNumber={33}
            title="feat: create access gate to manage alphas/betas"
            amount="1000"
            currency="USD"
          />
        </div>
      </div>
    </div>
  );
}


