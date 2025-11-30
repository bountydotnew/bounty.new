import { db } from '@bounty/db';
import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

// Force dynamic rendering to avoid build-time static generation issues
export const dynamic = 'force-dynamic';

// Regex pattern for extracting font URL from Google Fonts CSS (defined at top level for performance)
const FONT_URL_REGEX = /src: url\((.+)\) format\('(opentype|truetype)'\)/;

// Helper function to fetch and convert image to data URL
async function fetchImageAsDataUrl(imageUrl: string): Promise<string | null> {
    try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const imageType = imageResponse.headers.get('content-type') || 'image/png';
            return `data:${imageType};base64,${imageBase64}`;
        }
    } catch {
        // If image fetch fails, return null to fall back to first letter
    }
    return null;
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

        // Try to fetch user by handle first using relational query API
        let userData = await db.query.user.findFirst({
            columns: {
                id: true,
                name: true,
                handle: true,
                image: true,
            },
            where: (fields, { eq }) => eq(fields.handle, handle.toLowerCase()),
        });

        // If not found by handle, try by userId (for backwards compatibility)
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

        if (!userData) {
            return new Response('User not found', { status: 404 });
        }

        // Get first letter of handle or name for avatar
        const displayName = userData.handle || userData.name || 'U';
        const firstLetter = displayName.charAt(0).toUpperCase();

        // Fetch and convert avatar image to data URL if available
        const avatarDataUrl = userData.image
            ? await fetchImageAsDataUrl(userData.image)
            : null;

        // Load Inter Semibold font from Google Fonts using the proper method
        async function loadGoogleFont(font: string, text: string) {
            const url = `https://fonts.googleapis.com/css2?family=${font}:wght@600&text=${encodeURIComponent(text)}`;
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
                // Font loading failed
            }
            return null;
        }

        // Load font with the text we'll be using
        const fontText = `Say hi to ${userData.handle || userData.name || 'User'}`;
        const interSemiboldFont = await loadGoogleFont('Inter', fontText);

        return new ImageResponse(
            <div
                style={{
                    backgroundColor: '#141414',
                    boxSizing: 'border-box',
                    height: '630px',
                    width: '1200px',
                    position: 'relative',
                    display: 'flex',
                    fontFamily: '"Inter", system-ui, sans-serif',
                }}
            >
                {/* Centered content container */}
                <div
                    style={{
                        position: 'absolute',
                        left: '373px',
                        top: '273px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* "Say hi to grim" row */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: '10px',
                        }}
                    >
                        {/* "Say hi to" text */}
                        <div
                            style={{
                                color: '#FFFFFF',
                                fontFamily: '"Inter", system-ui, sans-serif',
                                fontSize: '70px',
                                fontWeight: 600,
                                lineHeight: '84px',
                                whiteSpace: 'pre',
                            }}
                        >
                            Say hi to
                        </div>

                        {/* User badge container */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                            }}
                        >
                            {/* Dark gray pill badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    gap: '11px',
                                    backgroundColor: '#313131',
                                    borderRadius: '29px',
                                    padding: '11px 17px 11px 13px',
                                    height: '74px',
                                }}
                            >
                                {/* Avatar and username container */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '9px',
                                    }}
                                >
                                    {/* Avatar circle with user image */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: userData.image ? 'transparent' : '#FB6B28',
                                            borderRadius: '17px',
                                            width: '52px',
                                            height: '52px',
                                            outline: '3px solid #C95901',
                                            outlineOffset: '-3px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {avatarDataUrl ? (
                                            // biome-ignore lint/performance/noImgElement: Required for OG image rendering
                                            <img
                                                src={avatarDataUrl}
                                                alt=""
                                                width={52}
                                                height={52}
                                                style={{
                                                    width: '52px',
                                                    height: '52px',
                                                    objectFit: 'cover',
                                                    borderRadius: '17px',
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    color: '#FFFFFF',
                                                    fontFamily: 'system-ui, sans-serif',
                                                    fontSize: '40px',
                                                    fontWeight: 500,
                                                    lineHeight: '48px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {firstLetter}
                                            </div>
                                        )}
                                    </div>

                                    {/* Username container */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {/* Username text */}
                                        <div
                                            style={{
                                                color: '#FFFFFF',
                                                fontFamily: '"Inter", system-ui, sans-serif',
                                                fontSize: '40px',
                                                fontWeight: 600,
                                                lineHeight: '48px',
                                                whiteSpace: 'pre',
                                            }}
                                        >
                                            {userData.handle || userData.name || 'User'}
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown icon - inline SVG */}
                                <div
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M5.33334 6.66675L7.52861 8.86201C7.78896 9.12236 8.21107 9.12236 8.47141 8.86201L10.6667 6.66675"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with "on bounty.new" */}
                <div
                    style={{
                        position: 'absolute',
                        left: '477px',
                        top: '573px',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        padding: '0px 20px',
                    }}
                >
                    <div
                        style={{
                            color: '#FFFFFF',
                            fontFamily: '"Inter", system-ui, sans-serif',
                            fontSize: '25px',
                            fontWeight: 600,
                            lineHeight: '30px',
                            whiteSpace: 'pre',
                        }}
                    >
                        on
                    </div>

                    {/* Bounty logo - inline SVG */}
                    <svg
                        fill="none"
                        stroke="#fff"
                        strokeWidth="21.3696"
                        viewBox="0 0 153 179"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            width: '20px',
                            height: '24px',
                        }}
                        aria-hidden="true"
                    >
                        <path d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179" />
                    </svg>

                    <div
                        style={{
                            color: '#FFFFFF',
                            fontFamily: '"Inter", system-ui, sans-serif',
                            fontSize: '25px',
                            fontWeight: 600,
                            lineHeight: '30px',
                            whiteSpace: 'pre',
                        }}
                    >
                        bounty.new
                    </div>
                </div>
            </div>,
            {
                width: 1200,
                height: 630,
                fonts: interSemiboldFont
                    ? [
                        {
                            name: 'Inter',
                            data: interSemiboldFont,
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
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
        return new Response(`Failed to generate OG image: ${errorMessage}`, {
            status: 500,
        });
    }
}

