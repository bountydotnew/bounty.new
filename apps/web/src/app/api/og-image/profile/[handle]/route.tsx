import { db } from '@bounty/db';
import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const FONT_URL_REGEX = /src: url\((.+)\) format\('(opentype|truetype)'\)/;

async function fetchImageAsDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (imageResponse.ok) {
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const imageType =
        imageResponse.headers.get('content-type') || 'image/png';
      return `data:${imageType};base64,${imageBase64}`;
    }
  } catch {
    // Ignore avatar fetch failures and fall back to first letter.
  }
  return null;
}

type UserData = {
  id: string;
  name: string | null;
  handle: string | null;
  image: string | null;
};

async function fetchUserData(handle: string): Promise<UserData | undefined> {
  let userData = await db.query.user.findFirst({
    columns: {
      id: true,
      name: true,
      handle: true,
      image: true,
    },
    where: (fields, { eq }) => eq(fields.handle, handle.toLowerCase()),
  });

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

function UserBadgePill({
  userData,
  avatarDataUrl,
  firstLetter,
}: {
  userData: UserData;
  avatarDataUrl: string | null;
  firstLetter: string;
}) {
  return (
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
          gap: '8px',
          backgroundColor: '#26251E',
          borderRadius: '999px',
          padding: '11px 17px 11px 13px',
          height: '74px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FB6B28',
            borderRadius: '50%',
            width: '52px',
            height: '52px',
            overflow: 'hidden',
          }}
        >
          {avatarDataUrl ? (
            <img
              src={avatarDataUrl}
              alt=""
              width={52}
              height={52}
              style={{
                width: '52px',
                height: '52px',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
            />
          ) : (
            <div
              style={{
                color: '#FFFFFF',
                fontSize: '28px',
                fontWeight: 500,
                lineHeight: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {firstLetter}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '40px',
              fontWeight: 600,
              lineHeight: '48px',
            }}
          >
            {userData.handle || userData.name || 'User'}
          </div>
        </div>
      </div>
    </div>
  );
}

function BountyLogo() {
  return (
    <svg
      width="23"
      height="27"
      viewBox="0 0 18 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5939 7.7981C12.364 8.5714 14.4163 7.7412 15.1778 5.9439C15.9393 4.1465 15.1217 2.0626 13.3517 1.2893C11.5816 0.516 9.5294 1.3462 8.7678 3.1436C8.0063 4.9409 8.8239 7.0248 10.5939 7.7981ZM10.5939 7.7981L3.7756 4.8195M1 11.3206L4.2298 12.7316C5.9999 13.5049 8.0521 12.6747 8.8137 10.8774C9.5752 9.08 8.7576 6.9961 6.9876 6.2228L3.7578 4.8118M17 10.5969L13.7702 9.1859C12.0001 8.4126 9.9479 9.2428 9.1863 11.0402L9.1883 20"
        stroke="#26251E"
        strokeWidth="2"
      />
    </svg>
  );
}

function OgFooter() {
  return (
    <div
      style={{
        position: 'absolute',
        right: '20px',
        bottom: '17px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
      }}
    >
      <div
        style={{
          color: '#26251E',
          fontSize: '35px',
          fontWeight: 600,
          lineHeight: '42px',
        }}
      >
        on
      </div>

      <BountyLogo />

      <div
        style={{
          color: '#26251E',
          fontSize: '35px',
          fontWeight: 600,
          lineHeight: '42px',
        }}
      >
        bounty.new
      </div>
    </div>
  );
}

function OgProfileImage({
  userData,
  avatarDataUrl,
  firstLetter,
}: {
  userData: UserData;
  avatarDataUrl: string | null;
  firstLetter: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        height: '630px',
        width: '1200px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            color: '#26251E',
            fontSize: '70px',
            fontWeight: 600,
            lineHeight: '84px',
          }}
        >
          Say hi to
        </div>

        <UserBadgePill
          userData={userData}
          avatarDataUrl={avatarDataUrl}
          firstLetter={firstLetter}
        />
      </div>

      <OgFooter />
    </div>
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    if (!handle) {
      return new Response('Handle is required', { status: 400 });
    }

    const userData = await fetchUserData(handle);

    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    const displayName = userData.handle || userData.name || 'U';
    const firstLetter = displayName.charAt(0).toUpperCase();

    const avatarDataUrl = userData.image
      ? await fetchImageAsDataUrl(userData.image)
      : null;

    async function loadGoogleFont(font: string, text: string) {
      const url = `https://fonts.googleapis.com/css2?family=${font}:wght@500;600&text=${encodeURIComponent(text)}`;
      try {
        const css = await (await fetch(url)).text();
        const resource = css.match(FONT_URL_REGEX);

        if (resource) {
          const response = await fetch(resource[1]);
          if (response.status === 200) {
            return await response.arrayBuffer();
          }
        }
      } catch {
        // Ignore font loading errors and render with system font.
      }
      return null;
    }

    const fontText = `Say hi to ${userData.handle || userData.name || 'User'} on bounty.new ${firstLetter}`;
    const interFont = await loadGoogleFont('Inter', fontText);

    return new ImageResponse(
      <OgProfileImage
        userData={userData}
        avatarDataUrl={avatarDataUrl}
        firstLetter={firstLetter}
      />,
      {
        width: 1200,
        height: 630,
        fonts: interFont
          ? [
              {
                name: 'Inter',
                data: interFont,
                weight: 600,
                style: 'normal',
              },
            ]
          : [],
        headers: {
          'Cache-Control':
            'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(`Failed to generate OG image: ${errorMessage}`, {
      status: 500,
    });
  }
}
