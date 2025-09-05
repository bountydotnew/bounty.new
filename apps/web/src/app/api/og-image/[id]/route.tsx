import { bounty, db } from '@bounty/db';
import { env } from '@bounty/env/server';
import { ImageResponse } from '@vercel/og';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { baseUrl } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const thisBounty = await db.query.bounty.findFirst({
      where: eq(bounty.id, id),
    });

    if (!thisBounty) {
      return new Response('Bounty not found', { status: 404 });
    }

    const { repositoryUrl, issueUrl } = thisBounty;

    if (!(repositoryUrl && issueUrl)) {
      return new Response('Bounty does not have a repository or issue', {
        status: 400,
      });
    }

    const [owner, repo] = repositoryUrl.split('/').slice(-2);

    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(env.GITHUB_TOKEN && {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!repoResponse.ok) {
      throw new Error(
        `GitHub API Error: ${repoResponse.status} ${repoResponse.statusText}`
      );
    }

    let repoData: {
      name: string;
      description: string;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      owner: {
        login: string;
        avatar_url: string;
      };
    } = await repoResponse.json();

    let difficultyStyles: {
      border: string;
      backgroundColor: string;
    } = {
      border: '1px solid #151515',
      backgroundColor: '#151515',
    };

    if (thisBounty.difficulty === 'beginner') {
      difficultyStyles = {
        border: '1px solid #151515',
        backgroundColor: '#151515',
      };
    } else if (thisBounty.difficulty === 'intermediate') {
      difficultyStyles = {
        border: '1px solid #147224',
        backgroundColor: '#147224',
      };
    } else if (thisBounty.difficulty === 'advanced') {
      difficultyStyles = {
        border: '1px solid #C44F16',
        backgroundColor: '#C44F16',
      };
    } else if (thisBounty.difficulty === 'expert') {
      difficultyStyles = {
        border: '1px solid #9f0712',
        backgroundColor: '#9f0712',
      };
    }

    repoData = await repoResponse.json();

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          fontFamily: 'Geist, system-ui, sans-serif',
          position: 'relative',
          display: 'flex',
        }}
      >
        <img // eslint-disable-line @next/next/no-img-element
          alt="og-bg"
          src={`${baseUrl}/og-bg.png`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <img // eslint-disable-line @next/next/no-img-element
          alt="bounty"
          src={`${baseUrl}/bounty.png`}
          style={{
            position: 'absolute',
            top: 80,
            right: 80,
            width: '90px',
            height: '107px',
            objectFit: 'cover',
          }}
        />
        {/* <div
            style={{
              position: "absolute",
              top: 0,
              left: 90,
              height: "100%",
              width: "2px",
              backgroundColor: "#000",
              opacity: 0.3,
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 90,
              height: "100%",
              width: "2px",
              backgroundColor: "#000",
              opacity: 0.3,
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 90,
              left: 0,
              right: 0,
              width: "100%",
              height: "2px",
              backgroundColor: "#000",
              opacity: 0.3,
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 90,
              right: 0,
              left: 0,
              width: "100%",
              height: "2px",
              backgroundColor: "#000",
              opacity: 0.3,
              zIndex: 10,
            }}
          /> */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
          }}
        >
          <img // eslint-disable-line @next/next/no-img-element
            alt={`${repoData.owner.login} avatar`}
            height="190"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(repoData.owner.login)}&size=160`;
            }}
            src={repoData.owner.avatar_url}
            style={{
              position: 'absolute',
              top: '80px',
              left: '80px',
              borderRadius: '50%',
            }}
            width="190"
          />
          <div
            style={{
              position: 'absolute',
              top: '366px',
              left: '80px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '44px',
                fontWeight: 'bolder',
                color: '#E5E5E5',
                lineHeight: '1.1',
                display: 'flex',
              }}
            >
              {owner}/{repo}{' '}
              <span style={{ color: '#D0D0D070' }}>
                #{thisBounty.issueUrl?.split('/').pop()}
              </span>
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#D0D0D0',
                lineHeight: '1.4',
                maxWidth: '500px',
                display: 'flex',
              }}
            >
              {thisBounty.title}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '16px',
                height: '50px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  color: '#D0D0D0',
                  lineHeight: '1.4',
                  maxWidth: '700px',
                  display: 'flex',
                  fontWeight: '700',

                  border: '1px solid #147224',
                  borderTop: '1px solid #ffffff50',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  backgroundColor: '#147224',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0px 0px 8.5px 0px rgba(0, 0, 0, 0.25)',
                }}
              >
                {formatCurrency(Number(thisBounty.amount), thisBounty.currency)}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: '#D0D0D0',
                  lineHeight: '1.4',
                  maxWidth: '700px',
                  display: 'flex',

                  ...difficultyStyles,
                  borderTop: '1px solid #ffffff50',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0px 0px 8.5px 0px rgba(0, 0, 0, 0.25)',
                  textTransform: 'capitalize',
                }}
              >
                {thisBounty.difficulty}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '460px',
              right: '80px',
              fontSize: '32px',
              color: '#D0D0D0',
              lineHeight: '1.4',
              maxWidth: '700px',
              display: 'flex',

              border: '1px solid #151515',
              borderTop: '1px solid #ffffff50',
              borderRadius: '18px',
              padding: '20px 64px',
              backgroundColor: '#151515',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0px 0px 8.5px 0px rgba(0, 0, 0, 0.25)',

              filter: 'invert(1)',
            }}
          >
            Claim{' '}
            {formatCurrency(Number(thisBounty.amount), thisBounty.currency)}
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
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
