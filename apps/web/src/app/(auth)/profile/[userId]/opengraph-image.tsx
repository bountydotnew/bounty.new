import { ImageResponse } from 'next/og';
import { db } from '@bounty/db';

export const alt = 'Profile';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

async function loadGoogleFont(font: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype|woff2)'\)/
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('failed to load font data');
}

async function fetchUserData(handle: string) {
  // Try finding by handle first
  let userData = await db.query.user.findFirst({
    columns: {
      id: true,
      name: true,
      handle: true,
      image: true,
    },
    where: (fields, { eq }) => eq(fields.handle, handle.toLowerCase()),
  });

  // Fall back to finding by ID
  if (!userData) {
    userData = await db.query.user.findFirst({
      columns: {
        id: true,
        name: true,
        handle: true,
        image: true,
      },
      where: (fields, { eq }) => eq(fields.id, handle),
    });
  }

  return userData;
}

export default async function Image({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const userData = await fetchUserData(userId);

  if (!userData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            color: '#26251E',
            fontSize: 48,
            fontFamily: 'Inter',
          }}
        >
          User Not Found
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'Inter',
            data: await loadGoogleFont('Inter', 600, 'User Not Found'),
            style: 'normal',
            weight: 600,
          },
        ],
      }
    );
  }

  const displayName = userData.handle || userData.name || 'User';
  const firstLetter = displayName.charAt(0).toUpperCase();

  // Collect all text for font loading
  const allText = `Say hi to ${displayName} on bounty.new ${firstLetter}`;

  // Load fonts in parallel
  const [interMedium, interSemiBold] = await Promise.all([
    loadGoogleFont('Inter', 500, allText),
    loadGoogleFont('Inter', 600, allText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          height: '100%',
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter',
        }}
      >
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              color: '#26251E',
              fontSize: 70,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Say hi to
          </div>

          {/* User badge pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#26251E',
                borderRadius: 999,
                padding: '11px 17px 11px 13px',
                height: 74,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FB6B28',
                  borderRadius: '50%',
                  width: 52,
                  height: 52,
                  overflow: 'hidden',
                }}
              >
                {userData.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userData.image}
                    alt=""
                    width={52}
                    height={52}
                    style={{
                      width: 52,
                      height: 52,
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      color: '#FFFFFF',
                      fontSize: 28,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {firstLetter}
                  </div>
                )}
              </div>

              {/* Handle */}
              <div
                style={{
                  color: '#FFFFFF',
                  fontSize: 40,
                  fontWeight: 600,
                }}
              >
                {displayName}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            right: 20,
            bottom: 17,
            display: 'flex',
            alignItems: 'center',
            gap: 15,
          }}
        >
          <div
            style={{
              color: '#26251E',
              fontSize: 35,
              fontWeight: 600,
            }}
          >
            on
          </div>

          {/* Bounty logo */}
          <svg
            width="23"
            height="27"
            viewBox="0 0 18 21"
            fill="none"
            style={{ display: 'flex' }}
          >
            <path
              d="M10.5939 7.7981C12.364 8.5714 14.4163 7.7412 15.1778 5.9439C15.9393 4.1465 15.1217 2.0626 13.3517 1.2893C11.5816 0.516 9.5294 1.3462 8.7678 3.1436C8.0063 4.9409 8.8239 7.0248 10.5939 7.7981ZM10.5939 7.7981L3.7756 4.8195M1 11.3206L4.2298 12.7316C5.9999 13.5049 8.0521 12.6747 8.8137 10.8774C9.5752 9.08 8.7576 6.9961 6.9876 6.2228L3.7578 4.8118M17 10.5969L13.7702 9.1859C12.0001 8.4126 9.9479 9.2428 9.1863 11.0402L9.1883 20"
              stroke="#26251E"
              strokeWidth="2"
            />
          </svg>

          <div
            style={{
              color: '#26251E',
              fontSize: 35,
              fontWeight: 600,
            }}
          >
            bounty.new
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interMedium,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'Inter',
          data: interSemiBold,
          style: 'normal',
          weight: 600,
        },
      ],
    }
  );
}
