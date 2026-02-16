'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { devNames } from './demo-data';
import { MockBrowser } from './mockup';

function GitHubIssuePage() {
  const [commentSent, setCommentSent] = useState(false);
  const [botReacted, setBotReacted] = useState(false);
  const [botReplied, setBotReplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [randomDev] = useState(
    () => devNames[Math.floor(Math.random() * devNames.length)]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (botReplied && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 300);
    }
  }, [botReplied]);

  const handleSendComment = () => {
    setCommentSent(true);
    setTimeout(() => setBotReacted(true), 1200);
    setTimeout(() => setBotReplied(true), 2800);
  };

  return (
    <div className="bg-gh-bg h-full overflow-auto" ref={scrollRef}>
      <div className="border-b border-gh-border px-6 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gh-text">
            Add OAuth integration for Google and GitHub
            <span className="text-gh-text-muted font-normal ml-2">#42</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-gh-text-muted">
            <span className="inline-flex items-center gap-1.5 bg-gh-success text-white px-2.5 py-1 rounded-full text-xs font-medium">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                <path
                  fillRule="evenodd"
                  d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
                />
              </svg>
              Open
            </span>
            <span>
              <a
                href="/contributors"
                className="text-gh-link hover:underline font-semibold"
              >
                ripgrim
              </a>{' '}
              opened this issue 2 days ago · {commentSent ? '4' : '3'} comments
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <Image
              src="/images/gcomb.jpeg"
              alt="ripgrim avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div className="flex-1 border border-gh-border rounded-md">
            <div className="bg-gh-surface px-4 py-2 border-b border-gh-border flex items-center justify-between">
              <div className="text-sm text-gh-text">
                <a
                  href="/bounties"
                  className="font-semibold hover:text-gh-link"
                >
                  ripgrim
                </a>
                <span className="text-gh-text-muted ml-2">2 days ago</span>
              </div>
            </div>
            <div className="p-4 text-sm text-gh-text">
              <p>
                Need OAuth integration for Google and GitHub sign-in with proper
                error handling.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0">
            <Image
              src="/images/ruo10xfk-400x400.jpg"
              alt="bountydotnew avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div className="flex-1 border border-gh-border rounded-md">
            <div className="bg-gh-surface px-4 py-2 border-b border-gh-border flex items-center justify-between">
              <div className="text-sm text-gh-text">
                <a
                  href="/bounties"
                  className="font-semibold hover:text-gh-link"
                >
                  bountydotnew
                </a>
                <span className="inline-flex items-center gap-1 bg-gh-link/10 text-gh-link px-1.5 py-0.5 rounded text-xs ml-1.5 border border-gh-link/20">
                  bot
                </span>
                <span className="text-gh-text-muted ml-1.5">
                  2 days ago – with{' '}
                  <a href="/bounties" className="text-gh-link hover:underline">
                    bountydotnew
                  </a>
                </span>
              </div>
            </div>
            <div className="p-4 text-sm text-gh-text">
              <p>
                <span className="text-gh-success-text">✓</span> Bounty created:{' '}
                <strong>$500</strong>
              </p>
              <p className="text-gh-text-muted text-xs mt-2">
                Submit your solution with{' '}
                <code className="bg-gh-surface px-1.5 py-0.5 rounded">
                  @bountydotnew /submit
                </code>{' '}
                in your PR
              </p>
            </div>
            <div className="px-4 pb-3 flex items-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-gh-border flex items-center justify-center text-gh-text-muted hover:border-gh-link hover:text-gh-link transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0">
            <Image
              src={`https://github.com/${randomDev}.png`}
              alt={`${randomDev} avatar`}
              width={40}
              height={40}
              className="rounded-full"
              unoptimized
            />
          </div>
          <div className="flex-1 border border-gh-border rounded-md">
            <div className="bg-gh-surface px-4 py-2 border-b border-gh-border flex items-center justify-between">
              <div className="text-sm text-gh-text">
                <a
                  href="/bounties"
                  className="font-semibold hover:text-gh-link"
                >
                  {randomDev}
                </a>
                <span className="text-gh-text-muted ml-2">3 hours ago</span>
              </div>
            </div>
            <div className="p-4 text-sm text-gh-text">
              <p className="mb-3">
                I've implemented the OAuth integration! Check out PR #47
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0">
            <Image
              src={`https://github.com/${randomDev}.png`}
              alt={`${randomDev} avatar`}
              width={40}
              height={40}
              className="rounded-full"
              unoptimized
            />
          </div>
          <div className="flex-1">
            <div className="border border-gh-border rounded-md">
              <textarea
                value="@bountydotnew /submit #47"
                readOnly
                rows={2}
                className="w-full bg-gh-bg px-4 py-3 text-gh-text focus:outline-none font-mono text-sm resize-none"
              />
              <div className="bg-gh-surface px-4 py-2 border-t border-gh-border flex justify-between items-center">
                <div className="text-xs text-gh-text-muted">
                  {commentSent && botReacted && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-lg">👀</span>
                      <span className="text-gh-link">@bountydotnew</span>{' '}
                      reacted
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={commentSent}
                  className={`bg-gh-success text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-success disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    commentSent
                      ? ''
                      : 'animate-pulse shadow-md shadow-success/40'
                  }`}
                >
                  {commentSent ? 'Sent' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {botReplied && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="shrink-0">
              <Image
                src="/images/ruo10xfk-400x400.jpg"
                alt="bountydotnew avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <div className="flex-1 border border-gh-border rounded-md">
              <div className="bg-gh-surface px-4 py-2 border-b border-gh-border">
                <div className="text-sm text-gh-text">
                  <a
                    href="/bounties"
                    className="font-semibold hover:text-gh-link"
                  >
                    bountydotnew
                  </a>
                  <span className="inline-flex items-center gap-1 bg-gh-link/10 text-gh-link px-1.5 py-0.5 rounded text-xs ml-1.5 border border-gh-link/20">
                    bot
                  </span>
                  <span className="text-gh-text-muted ml-1.5">
                    just now – with{' '}
                    <a
                      href="/bounties"
                      className="text-gh-link hover:underline"
                    >
                      bountydotnew
                    </a>
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-gh-text">
                <p>
                  Submission received from{' '}
                  <a
                    href="/contributors"
                    className="text-gh-link hover:underline"
                  >
                    @{randomDev}
                  </a>
                  . Waiting for maintainer approval.
                </p>
              </div>
              <div className="px-4 pb-3 flex items-center gap-2">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-gh-border flex items-center justify-center text-gh-text-muted hover:border-gh-link hover:text-gh-link transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SubmitSolutionDemo() {
  return (
    <MockBrowser
      initialUrl="github.com/bountydotnew/bounty.new/issues/42"
      headlights
    >
      <MockBrowser.Toolbar />
      <div className="flex-1 relative overflow-hidden">
        <MockBrowser.Page url="github.com/bountydotnew/bounty.new/issues/42">
          <GitHubIssuePage />
        </MockBrowser.Page>
      </div>
    </MockBrowser>
  );
}
