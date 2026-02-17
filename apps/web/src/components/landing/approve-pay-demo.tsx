'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useSyncExternalStore } from 'react';
import { ChevronDown } from 'lucide-react';
import { devNames } from './demo-data';
import { MockBrowser, useMockBrowser } from './mockup';

// ─────────────────────────────────────────────────────────────────────────────
// Create PR Page
// ─────────────────────────────────────────────────────────────────────────────
function CreatePRPage() {
  const { navigate } = useMockBrowser();
  const [prTitle, setPrTitle] = useState(
    'Tembo/code review optimize discord bot'
  );
  const [prDescription, setPrDescription] = useState(
    "Refactored the Discord bot's code review system for better performance and maintainability. Key changes include optimized message parsing, improved error handling, and reduced API calls."
  );

  const handleCreatePR = () => {
    navigate('github.com/bountydotnew/bounty.new/pull/47');
  };

  return (
    <div className="bg-gh-bg h-full overflow-auto">
      <div className="flex h-full">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <label className="block text-gh-text text-lg font-semibold mb-3" htmlFor="demo-pr-title">
              Add a title
            </label>
            <input
              id="demo-pr-title"
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-2 text-gh-text focus:outline-none focus:border-gh-link"
              placeholder="Title"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gh-text text-lg font-semibold mb-3" htmlFor="demo-pr-description">
              Add a description
            </label>
            <div className="border border-gh-border rounded-md overflow-hidden">
              <div className="bg-gh-surface border-b border-gh-border px-4">
                <div className="flex gap-0">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm text-gh-text border-b-2 border-gh-error-text -mb-px"
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm text-gh-text-muted"
                  >
                    Preview
                  </button>
                </div>
              </div>

              <div className="bg-gh-bg min-h-[180px] p-4">
                <textarea
                  id="demo-pr-description"
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  placeholder="Add your description here..."
                  className="w-full h-[160px] bg-transparent text-gh-text text-sm resize-none focus:outline-none placeholder-gh-text-muted"
                />
              </div>

              <div className="bg-gh-bg border-t border-gh-border px-4 py-2 flex items-center gap-4 text-xs text-gh-text-muted">
                <span>Markdown is supported</span>
                <span>Paste, drop, or click to add files</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gh-text-muted">
              Remember, contributions should follow our{' '}
              <span className="text-gh-link">GitHub Community Guidelines</span>
              .
            </p>
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleCreatePR}
                className="px-4 py-2 rounded-l-md text-[11px] font-medium text-white bg-gh-success hover:bg-success transition-all whitespace-nowrap animate-pulse shadow-md shadow-success/40"
              >
                Create pull request
              </button>
              <button
                type="button"
                className="bg-gh-success/80 px-2 py-2 rounded-r-md border-l border-success text-white"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gh-border flex items-center justify-center gap-8 text-sm text-gh-text-muted">
            <span>
              <strong className="text-gh-text">2</strong> commits
            </span>
            <span>
              <strong className="text-gh-text">55</strong> files changed
            </span>
            <span>
              <strong className="text-gh-text">3</strong> contributors
            </span>
          </div>
        </div>

        <div className="w-64 border-l border-gh-border p-4 space-y-4">
          {[
            { label: 'Reviewers', value: 'No reviews' },
            { label: 'Assignees', value: 'No one' },
            { label: 'Labels', value: 'None yet' },
            { label: 'Projects', value: 'None yet' },
            { label: 'Milestone', value: 'No milestone' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gh-text-muted">
                  {item.label}
                </span>
              </div>
              <p className="text-xs text-gh-text-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PR Comments Page
// ─────────────────────────────────────────────────────────────────────────────
function PRCommentsPage({
  onShowNotifications,
}: {
  onShowNotifications: () => void;
}) {
  const [devCommented, setDevCommented] = useState(false);
  const [maintainerReviewed, setMaintainerReviewed] = useState(false);
  const [maintainerApproved, setMaintainerApproved] = useState(false);
  const [botReplied, setBotReplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const randomDevRef = useRef(devNames[Math.floor(Math.random() * devNames.length)]);
  const randomDev = useSyncExternalStore(
    () => () => {},
    () => randomDevRef.current,
    () => devNames[0]
  );

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 300);
    }
  }, [devCommented, maintainerReviewed, maintainerApproved, botReplied]);

  useEffect(() => {
    if (!devCommented) {
      const timer = setTimeout(() => setDevCommented(true), 400);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [devCommented]);

  useEffect(() => {
    if (devCommented && !maintainerReviewed) {
      const timer = setTimeout(() => setMaintainerReviewed(true), 1200);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [devCommented, maintainerReviewed]);

  useEffect(() => {
    if (maintainerReviewed && !maintainerApproved) {
      const timer = setTimeout(() => setMaintainerApproved(true), 2000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [maintainerReviewed, maintainerApproved]);

  useEffect(() => {
    if (maintainerApproved && !botReplied) {
      const timer = setTimeout(() => {
        setBotReplied(true);
        setTimeout(() => onShowNotifications(), 800);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [maintainerApproved, botReplied, onShowNotifications]);

  return (
    <div className="bg-gh-bg h-full overflow-auto relative" ref={scrollRef}>
      <div className="border-b border-gh-border px-6 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gh-text">
            Tembo/code review optimize discord bot
            <span className="text-gh-text-muted font-normal ml-2">#47</span>
          </h1>
          <div className="flex items-center flex-wrap gap-2 text-sm text-gh-text-muted">
            <span className="inline-flex items-center gap-1.5 bg-gh-success text-white px-2.5 py-1 rounded-full text-xs font-medium">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
              </svg>
              Open
            </span>
            <span>
              <span className="text-gh-link font-semibold">{randomDev}</span>{' '}
              wants to merge 2 commits into{' '}
              <span className="px-1.5 py-0.5 rounded-md bg-gh-link/15 text-gh-link text-xs font-mono">
                main
              </span>{' '}
              from{' '}
              <span className="px-1.5 py-0.5 rounded-md bg-gh-link/15 text-gh-link text-xs font-mono">
                tembo/optimize-discord-bot
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {devCommented && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Image
                src={`https://github.com/${randomDev}.png`}
                alt={randomDev}
                className="w-10 h-10 rounded-full"
              />
            </div>
            <div className="flex-1 border border-gh-border rounded-md">
              <div className="bg-gh-surface px-4 py-2 border-b border-gh-border">
                <div className="text-sm text-gh-text">
                  <span className="font-semibold text-gh-link">
                    {randomDev}
                  </span>
                  <span className="text-gh-text-muted ml-2">2 minutes ago</span>
                </div>
              </div>
              <div className="p-4 text-sm text-gh-text">
                <p>I've implemented the requested changes. Ready for review!</p>
              </div>
            </div>
          </div>
        )}

        {maintainerReviewed && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Image
                src="/images/gcomb.jpeg"
                alt="ripgrim"
                className="w-10 h-10 rounded-full"
              />
            </div>
            <div className="flex-1 border border-gh-border rounded-md">
              <div className="bg-gh-surface px-4 py-2 border-b border-gh-border">
                <div className="text-sm text-gh-text">
                  <span className="font-semibold text-gh-link">
                    ripgrim
                  </span>
                  <span className="text-gh-text-muted ml-2">1 minute ago</span>
                </div>
              </div>
              <div className="p-4 text-sm text-gh-text">
                <p>
                  Looks great! The implementation is clean and well-tested.
                  Approving now.
                </p>
              </div>
            </div>
          </div>
        )}

        {maintainerApproved && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Image
                src="/images/gcomb.jpeg"
                alt="ripgrim"
                className="w-10 h-10 rounded-full"
              />
            </div>
            <div className="flex-1 border border-gh-border rounded-md">
              <div className="bg-gh-surface px-4 py-2 border-b border-gh-border">
                <div className="text-sm text-gh-text">
                  <span className="font-semibold text-gh-link">
                    ripgrim
                  </span>
                  <span className="text-gh-text-muted ml-2">just now</span>
                </div>
              </div>
              <div className="p-4 text-sm">
                <p className="text-gh-text">
                  <span className="text-gh-link">
                    @bountydotnew
                  </span>{' '}
                  /approve
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
                <span className="inline-flex items-center gap-1 bg-gh-border px-2 py-0.5 rounded-full text-xs">
                  <span>👀</span>
                  <span className="text-gh-text-muted">1</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {botReplied && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Image
                src="/images/ruo10xfk-400x400.jpg"
                alt="bountydotnew"
                className="w-10 h-10 rounded-full"
              />
            </div>
            <div className="flex-1 border border-gh-border rounded-md">
              <div className="bg-gh-surface px-4 py-2 border-b border-gh-border">
                <div className="text-sm text-gh-text">
                  <span className="font-semibold text-gh-link">
                    bountydotnew
                  </span>
                  <span className="inline-flex items-center gap-1 bg-gh-link/10 text-gh-link px-1.5 py-0.5 rounded text-xs ml-1.5 border border-gh-link/20">
                    bot
                  </span>
                  <span className="text-gh-text-muted ml-1.5">
                    just now – with{' '}
                    <span className="text-gh-link">
                      bountydotnew
                    </span>
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-gh-text">
                <p>
                  <span className="text-gh-link">
                    @ripgrim
                  </span>{' '}
                  Approved. When you're ready, merge the PR and confirm here
                  with{' '}
                  <code className="bg-gh-surface px-1.5 py-0.5 rounded text-xs">
                    /merge 47
                  </code>{' '}
                  (or comment{' '}
                  <span className="text-gh-link">
                    @bountydotnew
                  </span>{' '}
                  merge on the PR). Merging releases the payout.
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
                <span className="inline-flex items-center gap-1 bg-gh-border px-2 py-0.5 rounded-full text-xs">
                  <span>👀</span>
                  <span className="text-gh-text-muted">1</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────────────────
export function ApprovePayDemo({
  onShowNotifications,
}: {
  onShowNotifications: () => void;
}) {
  return (
    <MockBrowser
      initialUrl="github.com/bountydotnew/bounty.new/compare/main...feature"
      headlights
    >
      <MockBrowser.Toolbar />
      <div className="flex-1 relative overflow-hidden">
        <MockBrowser.Page url="github.com/bountydotnew/bounty.new/compare/main...feature">
          <CreatePRPage />
        </MockBrowser.Page>
        <MockBrowser.Page url="github.com/bountydotnew/bounty.new/pull/47">
          <PRCommentsPage onShowNotifications={onShowNotifications} />
        </MockBrowser.Page>
      </div>
    </MockBrowser>
  );
}
