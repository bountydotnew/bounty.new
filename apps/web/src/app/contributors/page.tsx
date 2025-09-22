'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import Link from '@bounty/ui/components/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, GitFork, GitGraph, Github, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataBuddyIcon, MarbleIcon } from '@/components/icons';
import { Header } from '@/components/sections/home/header';
import { LINKS } from '@/constants';
import { trpc } from '@/utils/trpc';

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

const REPOSITORY = 'bountydotnew/bounty.new';
const POLL_INTERVAL = 30_000;
const EXCLUDE = ['dependabot', 'github-actions', 'autofix-ci[bot]'];
const CORE = ['ripgrim'];

export default function ContributorsPage() {
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const lastCommitRef = useRef<string>('');

  const { data: contributors } = useQuery(
    trpc.repository.contributors.queryOptions({ repo: REPOSITORY })
  );
  const { data: repoStatsServer } = useQuery(
    trpc.repository.stats.queryOptions({ repo: REPOSITORY })
  );
  const { data: commitsData } = useQuery(
    trpc.repository.recentCommits.queryOptions({ repo: REPOSITORY, limit: 50 })
  );

  useEffect(() => {
    const poll = async () => {
      try {
        if (Array.isArray(commitsData) && commitsData.length) {
          lastCommitRef.current =
            (commitsData as { sha?: string }[])[0]?.sha ?? '';
        }
      } catch {}
    };
    poll();
    const i = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(i);
  }, [commitsData]);

  useEffect(() => {
    if (contributors && Array.isArray(contributors)) {
      setAllContributors(
        contributors.filter((c: Contributor) => !EXCLUDE.includes(c.login))
      );
    }
  }, [contributors]);

  const core = useMemo(
    () => allContributors.filter((c) => CORE.includes(c.login)),
    [allContributors]
  );
  const community = useMemo(
    () =>
      allContributors
        .filter((c) => !CORE.includes(c.login))
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 12),
    [allContributors]
  );

  const externalTools = [
    {
      id: 1,
      name: 'Databuddy',
      description: 'GDPR compliant analysis',
      icon: DataBuddyIcon,
      url: 'https://databuddy.cc',
      category: 'Analytics',
    },
    {
      id: 2,
      name: 'Marble',
      description: 'Headless CMS',
      icon: MarbleIcon,
      url: 'https://marblecms.com',
      category: 'Blog CMS',
    },
  ];

  return (
    <>
      {/* Full viewport background container */}
      <div className="-z-10 fixed inset-0 h-full w-full" />

      {/* Content container */}
      <div className="relative min-h-screen text-white">
        {/* Background geometric shapes */}
        {/* <div className="absolute inset-0 overflow-hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="153"
            height="179"
            viewBox="0 0 153 179"
            fill="none"
            className="absolute top-0 -right-[35rem] z-0 transition-transform duration-300 ease-out desktop-svg md:opacity-20 lg:opacity-10 opacity-10"
            style={{
              width: "75rem",
              height: "75rem",
            }}
          >
            <path
              d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
              stroke="url(#paint0_linear_34_3652)"
              strokeWidth="21.3696"
            />
            <defs>
              <linearGradient
                id="paint0_linear_34_3652"
                x1="35.4019"
                y1="-16.1847"
                x2="150.598"
                y2="205.685"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="rgba(239, 239, 239, 1)" />
                <stop offset="1" stopColor="rgba(146, 146, 146, 1)" />
              </linearGradient>
            </defs>
          </svg>
        </div> */}

        <Header />

        {/* Main content */}
        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-20">
          {/* Hero Section */}
          <div className="mb-20 max-w-4xl">
            <h1
              className="mb-8 font-display text-7xl leading-tight"
              style={{ color: 'rgba(239, 239, 239, 1)' }}
            >
              Contributors.
              <br />
              The builders.
            </h1>

            <p
              className="mb-12 max-w-2xl font-display-book text-xl leading-relaxed"
              style={{ color: 'rgba(146, 146, 146, 1)' }}
            >
              Meet the developers building bounty.new in public. Open-source
              contributions, transparent development, community-driven
              innovation.
            </p>

            {/* Repository Stats */}
            <div className="mb-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Star
                  className="h-5 w-5"
                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                />
                <span
                  className="font-bold font-display text-3xl"
                  style={{ color: 'rgba(239, 239, 239, 1)' }}
                >
                  {repoStatsServer?.repo.stargazersCount?.toLocaleString() ||
                    '0'}
                </span>
                <span
                  className="font-display-book"
                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                >
                  stars
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GitFork
                  className="h-5 w-5"
                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                />
                <span
                  className="font-bold font-display text-3xl"
                  style={{ color: 'rgba(239, 239, 239, 1)' }}
                >
                  {repoStatsServer?.repo.forksCount?.toLocaleString() || '0'}
                </span>
                <span
                  className="font-display-book"
                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                >
                  forks
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GitGraph
                  className="h-5 w-5"
                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                />
                <span
                  className="font-bold font-display text-3xl"
                  style={{ color: 'rgba(239, 239, 239, 1)' }}
                >
                  {allContributors.length}
                </span>
                <span
                  className="font-display-book"
                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                >
                  contributors
                </span>
              </div>
            </div>

            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-[#282828] px-6 py-3 font-display-book transition-colors hover:bg-white/5"
              href={LINKS.SOCIALS.GITHUB}
              style={{ color: 'rgba(146, 146, 146, 1)' }}
              target="_blank"
            >
              <Github className="h-4 w-4" />
              View on GitHub
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Core Team Section */}
          {core.length > 0 && (
            <section className="mb-20">
              <h2
                className="mb-12 font-bold font-display text-4xl"
                style={{ color: 'rgba(239, 239, 239, 1)' }}
              >
                Core Team
              </h2>
              <div className="grid gap-8">
                {core.map((contributor) => (
                  <Link
                    className="group flex items-center gap-6 rounded-2xl border border-[#282828] p-8 transition-all hover:bg-white/5"
                    href={contributor.html_url}
                    key={contributor.login}
                    target="_blank"
                  >
                    <Avatar className="h-16 w-16 ring-1 ring-[#282828]">
                      <AvatarImage src={contributor.avatar_url} />
                      <AvatarFallback className="font-display">
                        {contributor.login.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3
                          className="font-bold font-display text-2xl"
                          style={{ color: 'rgba(239, 239, 239, 1)' }}
                        >
                          {contributor.login}
                        </h3>
                        {contributor.login === 'ripgrim' && (
                          <span
                            className="rounded-full border border-[#282828] px-3 py-1 font-display-book text-sm"
                            style={{ color: 'rgba(146, 146, 146, 1)' }}
                          >
                            Founder
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-2 font-display-book"
                        style={{ color: 'rgba(146, 146, 146, 1)' }}
                      >
                        <GitGraph className="h-4 w-4" />
                        <span>
                          {contributor.contributions.toLocaleString()}{' '}
                          contributions
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: 'rgba(146, 146, 146, 1)' }}
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Contributors Grid */}
          <section className="mb-20">
            <h2
              className="mb-12 font-bold font-display text-4xl"
              style={{ color: 'rgba(239, 239, 239, 1)' }}
            >
              Top Contributors
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {community.map((contributor) => (
                <Link
                  className="group rounded-2xl border border-[#282828] p-6 text-center transition-all hover:bg-white/5"
                  href={contributor.html_url}
                  key={contributor.login}
                  target="_blank"
                >
                  <Avatar className="mx-auto mb-4 h-16 w-16 ring-1 ring-[#282828] transition-transform group-hover:scale-105">
                    <AvatarImage src={contributor.avatar_url} />
                    <AvatarFallback className="font-display">
                      {contributor.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3
                    className="mb-2 truncate font-display font-semibold"
                    style={{ color: 'rgba(239, 239, 239, 1)' }}
                  >
                    {contributor.login}
                  </h3>
                  <div
                    className="flex items-center justify-center gap-2 font-display-book text-sm"
                    style={{ color: 'rgba(146, 146, 146, 1)' }}
                  >
                    <GitGraph className="h-4 w-4" />
                    <span>{contributor.contributions}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* External Tools */}
          <section className="mb-20">
            <h2
              className="mb-12 font-bold font-display text-4xl"
              style={{ color: 'rgba(239, 239, 239, 1)' }}
            >
              External Tools
            </h2>
            <p
              className="mb-12 max-w-2xl font-display-book text-xl"
              style={{ color: 'rgba(146, 146, 146, 1)' }}
            >
              The tools and platforms that power our development workflow.
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {externalTools.map((tool) => (
                <Link
                  className="group rounded-2xl border border-[#282828] p-8 transition-all hover:bg-white/5"
                  href={tool.url}
                  key={tool.id}
                  target="_blank"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 items-center justify-center">
                      <tool.icon className="text-white" size={64} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-3 flex items-center justify-between">
                        <h3
                          className="font-bold font-display text-2xl"
                          style={{ color: 'rgba(239, 239, 239, 1)' }}
                        >
                          {tool.name}
                        </h3>
                        <span
                          className="rounded-full border border-[#282828] px-3 py-1 font-display-book text-sm"
                          style={{ color: 'rgba(146, 146, 146, 1)' }}
                        >
                          {tool.category}
                        </span>
                      </div>
                      <p
                        className="mb-4 font-display-book"
                        style={{ color: 'rgba(146, 146, 146, 1)' }}
                      >
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-2 font-display-book text-sm opacity-70">
                        <ArrowUpRight className="h-4 w-4" />
                        <span>Visit tool</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
