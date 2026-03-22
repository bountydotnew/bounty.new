import { ImageResponse } from 'next/og';
import { bounty, user, db } from '@bounty/db';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@bounty/ui/lib/utils';

export const alt = 'Bounty';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch bounty with creator
  const result = await db
    .select({
      title: bounty.title,
      amount: bounty.amount,
      currency: bounty.currency,
      creator: {
        name: user.name,
        image: user.image,
      },
    })
    .from(bounty)
    .innerJoin(user, eq(bounty.createdById, user.id))
    .where(eq(bounty.id, id))
    .limit(1);

  const thisBounty = result[0];

  if (!thisBounty) {
    // Fallback for missing bounty
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0E0E0E',
            color: '#FFFFFF',
            fontSize: 48,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Bounty Not Found
        </div>
      ),
      { ...size }
    );
  }

  const creatorName = thisBounty.creator.name || 'Anonymous';
  const creatorInitial = creatorName.charAt(0).toUpperCase();
  const creatorHandle = creatorName.startsWith('@') ? creatorName : `@${creatorName.toLowerCase().replace(/\s+/g, '')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 64px',
          backgroundColor: '#0E0E0E',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Chain link icon */}
            <svg
              width="20"
              height="24"
              viewBox="0 0 153 179"
              fill="none"
              style={{ display: 'flex' }}
            >
              <path
                d="M91.138 71.11C107.031 77.947 125.457 70.606 132.294 54.714C139.132 38.822 131.791 20.396 115.899 13.558C100.006 6.721 81.58 14.061 74.743 29.954C67.906 45.846 75.246 64.272 91.138 71.11ZM91.138 71.11L29.921 44.772M5 102.256L33.998 114.732C49.891 121.57 68.317 114.229 75.154 98.337C81.992 82.444 74.651 64.018 58.759 57.181L29.76 44.705M148.655 95.857L119.657 83.381C103.764 76.543 85.338 83.884 78.501 99.776L78.518 179"
                stroke="#FFFFFF"
                strokeWidth="21.37"
              />
            </svg>
            <span
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              bounty.new
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            gap: 32,
          }}
        >
          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {formatCurrency(Number(thisBounty.amount), thisBounty.currency)}
            </span>
          </div>

          {/* Title */}
          <span
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              maxWidth: 900,
            }}
          >
            {thisBounty.title}
          </span>
        </div>

        {/* Creator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {thisBounty.creator.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thisBounty.creator.image}
              alt={creatorName}
              width={44}
              height={44}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'white',
                }}
              >
                {creatorInitial}
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {creatorHandle}
            </span>
            <span
              style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Author
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
