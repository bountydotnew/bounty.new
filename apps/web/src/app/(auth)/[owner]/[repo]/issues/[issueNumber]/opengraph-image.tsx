import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import BountyIssueOgCard from '@/components/og/BountyIssueOgCard';

export const runtime = 'edge';
export const alt = 'Bounty Issue';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image(
  req: NextRequest,
  { params }: { params: { owner: string; repo: string; issueNumber: string } }
) {
  const owner = params.owner;
  const repo = params.repo;
  const issueNumber = params.issueNumber;
  let title = `#${issueNumber}`;
  let amount: string | undefined;
  let currency: string | undefined;
  try {
    const base = new URL(req.url).origin;
    const url = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
    const res = await fetch(
      `${base}/api/trpc/repository.issueFromUrl?input=${encodeURIComponent(JSON.stringify({ url }))}`
    );
    const json: unknown = await res.json();
    const issue = (
      json as {
        result?: {
          data?: {
            title?: string;
            detectedAmount?: string;
            detectedCurrency?: string;
          };
        };
      }
    )?.result?.data;
    title = issue?.title || title;
    amount = issue?.detectedAmount;
    currency = issue?.detectedCurrency;
  } catch {}

  const svgLogo = (
    <svg
      height="64"
      viewBox="0 0 188 45"
      width="64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#fff" height="45" rx="9" width="188" />
    </svg>
  );

  return new ImageResponse(
    <BountyIssueOgCard
      amount={amount}
      currency={currency}
      issueNumber={issueNumber}
      logo={svgLogo}
      owner={owner}
      repo={repo}
      title={title}
    />,
    {
      ...size,
    }
  );
}
