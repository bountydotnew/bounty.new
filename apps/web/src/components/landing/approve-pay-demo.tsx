"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { devNames } from './demo-data';
import { MockBrowser, useMockBrowser } from './mockup';

// ─────────────────────────────────────────────────────────────────────────────
// Create PR Page
// ─────────────────────────────────────────────────────────────────────────────
function CreatePRPage() {
  const { navigate } = useMockBrowser();
  const [prTitle, setPrTitle] = useState('Tembo/code review optimize discord bot');
  const [prDescription, setPrDescription] = useState(
    "Refactored the Discord bot's code review system for better performance and maintainability. Key changes include optimized message parsing, improved error handling, and reduced API calls.",
  );

  const handleCreatePR = () => {
    navigate('github.com/bountydotnew/bounty.new/pull/47');
  };

  return (
    <div className="bg-[#0d1117] h-full overflow-auto">
      <div className="flex h-full">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <label className="block text-[#c9d1d9] text-lg font-semibold mb-3">Add a title</label>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-4 py-2 text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
              placeholder="Title"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#c9d1d9] text-lg font-semibold mb-3">Add a description</label>
            <div className="border border-[#30363d] rounded-md overflow-hidden">
              <div className="bg-[#161b22] border-b border-[#30363d] px-4">
                <div className="flex gap-0">
                  <button type="button" className="px-4 py-2 text-sm text-[#c9d1d9] border-b-2 border-[#f78166] -mb-px">
                    Write
                  </button>
                  <button type="button" className="px-4 py-2 text-sm text-[#8b949e]">Preview</button>
                </div>
              </div>

              <div className="bg-[#0d1117] min-h-[180px] p-4">
                <textarea
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  placeholder="Add your description here..."
                  className="w-full h-[160px] bg-transparent text-[#c9d1d9] text-sm resize-none focus:outline-none placeholder-[#6e7681]"
                />
              </div>

              <div className="bg-[#0d1117] border-t border-[#30363d] px-4 py-2 flex items-center gap-4 text-xs text-[#8b949e]">
                <span>Markdown is supported</span>
                <span>Paste, drop, or click to add files</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8b949e]">
              Remember, contributions should follow our{' '}
              <a href="#" className="text-[#58a6ff] hover:underline">
                GitHub Community Guidelines
              </a>
              .
            </p>
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleCreatePR}
                className="px-4 py-2 rounded-l-md text-[11px] font-medium text-white bg-[#238636] hover:bg-[#2ea043] transition-all whitespace-nowrap animate-pulse shadow-[0_0_12px_rgba(35,134,54,0.4)]"
              >
                Create pull request
              </button>
              <button type="button" className="bg-[#238636]/80 px-2 py-2 rounded-r-md border-l border-[#2ea043] text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#30363d] flex items-center justify-center gap-8 text-sm text-[#8b949e]">
            <span>
              <strong className="text-[#c9d1d9]">2</strong> commits
            </span>
            <span>
              <strong className="text-[#c9d1d9]">55</strong> files changed
            </span>
            <span>
              <strong className="text-[#c9d1d9]">3</strong> contributors
            </span>
          </div>
        </div>

        <div className="w-64 border-l border-[#30363d] p-4 space-y-4">
          {[
            { label: 'Reviewers', value: 'No reviews' },
            { label: 'Assignees', value: 'No one' },
            { label: 'Labels', value: 'None yet' },
            { label: 'Projects', value: 'None yet' },
            { label: 'Milestone', value: 'No milestone' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#8b949e]">{item.label}</span>
              </div>
              <p className="text-xs text-[#8b949e]">{item.value}</p>
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
function PRCommentsPage({ onShowNotifications }: { onShowNotifications: () => void }) {
  const [devCommented, setDevCommented] = useState(false);
  const [maintainerReviewed, setMaintainerReviewed] = useState(false);
  const [maintainerApproved, setMaintainerApproved] = useState(false);
  const [botReplied, setBotReplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [randomDev] = useState(() => devNames[Math.floor(Math.random() * devNames.length)]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
    <div className="bg-[#0d1117] h-full overflow-auto relative" ref={scrollRef}>
      <div className="border-b border-[#30363d] px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-5 h-5 text-[#a371f7]" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#c9d1d9] mb-2">
              Tembo/code review optimize discord bot
              <span className="text-[#8b949e] font-normal ml-2">#47</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#8b949e]">
              <span className="inline-flex items-center gap-1 bg-[#a371f7] text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Open
              </span>
              <span>
                <a href="#" className="text-[#58a6ff] hover:underline">
                  {randomDev}
                </a>{' '}
                wants to merge 2 commits
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {devCommented && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img src={`https://github.com/${randomDev}.png`} alt={randomDev} className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex-1 border border-[#30363d] rounded-md">
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d]">
                <div className="text-sm text-[#c9d1d9]">
                  <a href="#" className="font-semibold hover:text-[#58a6ff]">
                    {randomDev}
                  </a>
                  <span className="text-[#8b949e] ml-2">2 minutes ago</span>
                </div>
              </div>
              <div className="p-4 text-sm text-[#c9d1d9]">
                <p>I've implemented the requested changes. Ready for review!</p>
              </div>
            </div>
          </div>
        )}

        {maintainerReviewed && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img src="/images/gcomb.jpeg" alt="ripgrim" className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex-1 border border-[#30363d] rounded-md">
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d]">
                <div className="text-sm text-[#c9d1d9]">
                  <a href="#" className="font-semibold hover:text-[#58a6ff]">
                    ripgrim
                  </a>
                  <span className="text-[#8b949e] ml-2">1 minute ago</span>
                </div>
              </div>
              <div className="p-4 text-sm text-[#c9d1d9]">
                <p>Looks great! The implementation is clean and well-tested. Approving now.</p>
              </div>
            </div>
          </div>
        )}

        {maintainerApproved && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img src="/images/gcomb.jpeg" alt="ripgrim" className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex-1 border border-[#30363d] rounded-md">
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d]">
                <div className="text-sm text-[#c9d1d9]">
                  <a href="#" className="font-semibold hover:text-[#58a6ff]">
                    ripgrim
                  </a>
                  <span className="text-[#8b949e] ml-2">just now</span>
                </div>
              </div>
              <div className="p-4 text-sm">
                <p className="text-[#c9d1d9]">
                  <a href="#" className="text-[#f78166] hover:underline">
                    @bountydotnew
                  </a>{' '}
                  /approve
                </p>
              </div>
              <div className="px-4 pb-3 flex items-center gap-2">
                <button type="button" className="w-7 h-7 rounded-full border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <span className="inline-flex items-center gap-1 bg-[#30363d] px-2 py-0.5 rounded-full text-xs">
                  <span>👀</span>
                  <span className="text-[#8b949e]">1</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {botReplied && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img src="/images/ruo10xfk-400x400.jpg" alt="bountydotnew" className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex-1 border border-[#30363d] rounded-md">
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d]">
                <div className="text-sm text-[#c9d1d9]">
                  <a href="#" className="font-semibold hover:text-[#58a6ff]">
                    bountydotnew
                  </a>
                  <span className="inline-flex items-center gap-1 bg-[#30363d] text-[#8b949e] px-1.5 py-0.5 rounded text-xs ml-1.5 border border-[#30363d]">
                    bot
                  </span>
                  <span className="text-[#8b949e] ml-1.5">
                    just now – with{' '}
                    <a href="#" className="text-[#58a6ff] hover:underline">
                      bountydotnew
                    </a>
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-[#c9d1d9]">
                <p>
                  <a href="#" className="text-[#f78166] hover:underline">
                    @ripgrim
                  </a>{' '}
                  Approved. When you're ready, merge the PR and confirm here with{' '}
                  <code className="bg-[#161b22] px-1.5 py-0.5 rounded text-xs">/merge 47</code> (or comment{' '}
                  <a href="#" className="text-[#f78166] hover:underline">
                    @bountydotnew
                  </a>{' '}
                  merge on the PR). Merging releases the payout.
                </p>
              </div>
              <div className="px-4 pb-3 flex items-center gap-2">
                <button type="button" className="w-7 h-7 rounded-full border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <span className="inline-flex items-center gap-1 bg-[#30363d] px-2 py-0.5 rounded-full text-xs">
                  <span>👀</span>
                  <span className="text-[#8b949e]">1</span>
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
export function ApprovePayDemo({ onShowNotifications }: { onShowNotifications: () => void }) {
  return (
    <MockBrowser initialUrl="github.com/bountydotnew/bounty.new/compare/main...feature" headlights>
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
