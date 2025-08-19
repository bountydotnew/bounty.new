"use client";

import {
  Github,
  GitGraph,
  Star,
  GitFork,
  ArrowUpRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { DataBuddyIcon, MarbleIcon } from "@/components/icons";
import React from "react";
import { LINKS } from "@/constants/links";
import { Header } from "@/components/sections/home/header";

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

const REPOSITORY = "bountydotnew/bounty.new";
const POLL_INTERVAL = 30000;
const EXCLUDE = ["dependabot", "github-actions", "autofix-ci[bot]"];
const CORE = ["ripgrim"];

export default function ContributorsPage() {
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const lastCommitRef = useRef<string>("");

  const { data: contributors } = useQuery(
    trpc.repository.contributors.queryOptions({ repo: REPOSITORY }),
  );
  const { data: repoStatsServer } = useQuery(
    trpc.repository.stats.queryOptions({ repo: REPOSITORY }),
  );
  const { data: commitsData } = useQuery(
    trpc.repository.recentCommits.queryOptions({ repo: REPOSITORY, limit: 50 }),
  );

  useEffect(() => {
    const poll = async () => {
      try {
        if (Array.isArray(commitsData) && commitsData.length)
          lastCommitRef.current =
            (commitsData as { sha?: string }[])[0]?.sha ?? "";
      } catch {}
    };
    poll();
    const i = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(i);
  }, [commitsData]);

  useEffect(() => {
    if (contributors && Array.isArray(contributors)) {
      setAllContributors(
        contributors.filter((c: Contributor) => !EXCLUDE.includes(c.login)),
      );
    }
  }, [contributors]);

  const core = useMemo(
    () => allContributors.filter((c) => CORE.includes(c.login)),
    [allContributors],
  );
  const community = useMemo(
    () =>
      allContributors
        .filter((c) => !CORE.includes(c.login))
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 12),
    [allContributors],
  );

  const externalTools = [
    {
      id: 1,
      name: "Databuddy",
      description: "GDPR compliant analysis",
      icon: DataBuddyIcon,
      url: "https://databuddy.cc",
      category: "Analytics",
    },
    {
      id: 2,
      name: "Marble",
      description: "Headless CMS",
      icon: MarbleIcon,
      url: "https://marblecms.com",
      category: "Blog CMS",
    },
  ];

  return (
    <>
      {/* Full viewport background container */}
      <div 
        className="fixed inset-0 w-full h-full -z-10"
      />
      
      {/* Content container */}
      <div className="min-h-screen text-white relative">
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
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
          {/* Hero Section */}
          <div className="max-w-4xl mb-20">
            <h1 className="text-7xl mb-8 leading-tight font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
              Contributors.
              <br />
              The builders.
            </h1>

            <p className="text-xl mb-12 max-w-2xl font-display-book leading-relaxed" style={{ color: "rgba(146, 146, 146, 1)" }}>
              Meet the developers building bounty.new in public. Open-source contributions, 
              transparent development, community-driven innovation.
            </p>

            {/* Repository Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5" style={{ color: "rgba(146, 146, 146, 1)" }} />
                <span className="text-3xl font-display font-bold" style={{ color: "rgba(239, 239, 239, 1)" }}>
                  {repoStatsServer?.repo.stargazersCount?.toLocaleString() || "0"}
                </span>
                <span className="font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>stars</span>
              </div>
              <div className="flex items-center gap-3">
                <GitFork className="w-5 h-5" style={{ color: "rgba(146, 146, 146, 1)" }} />
                <span className="text-3xl font-display font-bold" style={{ color: "rgba(239, 239, 239, 1)" }}>
                  {repoStatsServer?.repo.forksCount?.toLocaleString() || "0"}
                </span>
                <span className="font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>forks</span>
              </div>
              <div className="flex items-center gap-3">
                <GitGraph className="w-5 h-5" style={{ color: "rgba(146, 146, 146, 1)" }} />
                <span className="text-3xl font-display font-bold" style={{ color: "rgba(239, 239, 239, 1)" }}>
                  {allContributors.length}
                </span>
                <span className="font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>contributors</span>
              </div>
            </div>

            <Link
              href={LINKS.SOCIALS.GITHUB}
              target="_blank"
              className="inline-flex items-center gap-2 border border-[#282828] rounded-lg px-6 py-3 font-display-book hover:bg-white/5 transition-colors"
              style={{ color: "rgba(146, 146, 146, 1)" }}
            >
              <Github className="w-4 h-4" />
              View on GitHub
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Core Team Section */}
          {core.length > 0 && (
            <section className="mb-20">
              <h2 className="text-4xl font-bold mb-12 font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
                Core Team
              </h2>
              <div className="grid gap-8">
                {core.map((contributor) => (
                  <Link 
                    key={contributor.login}
                    href={contributor.html_url}
                    target="_blank"
                    className="group flex items-center gap-6 p-8 border border-[#282828] rounded-2xl hover:bg-white/5 transition-all"
                  >
                    <Avatar className="w-16 h-16 ring-1 ring-[#282828]">
                      <AvatarImage src={contributor.avatar_url} />
                      <AvatarFallback className="font-display">
                        {contributor.login.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
                          {contributor.login}
                        </h3>
                        {contributor.login === "ripgrim" && (
                          <span className="px-3 py-1 border border-[#282828] rounded-full text-sm font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>
                            Founder
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>
                        <GitGraph className="w-4 h-4" />
                        <span>{contributor.contributions.toLocaleString()} contributions</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(146, 146, 146, 1)" }} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Contributors Grid */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold mb-12 font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
              Top Contributors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {community.map((contributor) => (
                <Link
                  key={contributor.login}
                  href={contributor.html_url}
                  target="_blank"
                  className="group p-6 border border-[#282828] rounded-2xl hover:bg-white/5 transition-all text-center"
                >
                  <Avatar className="w-16 h-16 mx-auto mb-4 ring-1 ring-[#282828] group-hover:scale-105 transition-transform">
                    <AvatarImage src={contributor.avatar_url} />
                    <AvatarFallback className="font-display">
                      {contributor.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mb-2 font-display truncate" style={{ color: "rgba(239, 239, 239, 1)" }}>
                    {contributor.login}
                  </h3>
                  <div className="flex items-center justify-center gap-2 font-display-book text-sm" style={{ color: "rgba(146, 146, 146, 1)" }}>
                    <GitGraph className="w-4 h-4" />
                    <span>{contributor.contributions}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* External Tools */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold mb-12 font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
              External Tools
            </h2>
            <p className="text-xl mb-12 max-w-2xl font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>
              The tools and platforms that power our development workflow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {externalTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  className="group p-8 border border-[#282828] rounded-2xl hover:bg-white/5 transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <tool.icon size={64} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-2xl font-bold font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
                          {tool.name}
                        </h3>
                        <span className="text-sm px-3 py-1 border border-[#282828] rounded-full font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>
                          {tool.category}
                        </span>
                      </div>
                      <p className="font-display-book mb-4" style={{ color: "rgba(146, 146, 146, 1)" }}>
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-2 font-display-book text-sm opacity-70">
                        <ArrowUpRight className="w-4 h-4" />
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
