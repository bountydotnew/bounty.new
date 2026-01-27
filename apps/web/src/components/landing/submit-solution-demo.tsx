"use client";

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { devNames } from './demo-data';
import { MockBrowser } from './mockup';

function GitHubIssuePage() {
  const [commentSent, setCommentSent] = useState(false);
  const [botReacted, setBotReacted] = useState(false);
  const [botReplied, setBotReplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [randomDev] = useState(() => devNames[Math.floor(Math.random() * devNames.length)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (botReplied && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 300);
    }
  }, [botReplied]);

  const handleSendComment = () => {
    setCommentSent(true);
    setTimeout(() => setBotReacted(true), 1200);
    setTimeout(() => setBotReplied(true), 2800);
  };

  return (
    <div className="bg-[#0d1117] h-full overflow-auto" ref={scrollRef}>
      <div className="border-b border-[#30363d] px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1">
            <svg className="w-5 h-5 text-[#3fb950]" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#c9d1d9] mb-2">
              Add OAuth integration for Google and GitHub
              <span className="text-[#8b949e] font-normal ml-2">#42</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#8b949e]">
              <span className="inline-flex items-center gap-1 bg-[#1f6feb] text-white px-2 py-0.5 rounded-full text-xs font-medium">
                $500 Bounty
              </span>
              <span>opened by</span>
              <a href="/contributors" className="text-[#58a6ff] hover:underline">
                ripgrim
              </a>
              <span>2 days ago</span>
              <span>·</span>
              <span>{commentSent ? '4' : '3'} comments</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <Image src="/images/gcomb.jpeg" alt="ripgrim avatar" width={40} height={40} className="rounded-full" />
          </div>
          <div className="flex-1 border border-[#30363d] rounded-md">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
              <div className="text-sm text-[#c9d1d9]">
                <a href="/bounties" className="font-semibold hover:text-[#58a6ff]">
                  ripgrim
                </a>
                <span className="text-[#8b949e] ml-2">2 days ago</span>
              </div>
            </div>
            <div className="p-4 text-sm text-[#c9d1d9]">
              <p>Need OAuth integration for Google and GitHub sign-in with proper error handling.</p>
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
          <div className="flex-1 border border-[#30363d] rounded-md">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
              <div className="text-sm text-[#c9d1d9]">
                <a href="/bounties" className="font-semibold hover:text-[#58a6ff]">
                  bountydotnew
                </a>
                <span className="inline-flex items-center gap-1 bg-[#30363d] text-[#8b949e] px-1.5 py-0.5 rounded text-xs ml-1.5 border border-[#30363d]">
                  bot
                </span>
                <span className="text-[#8b949e] ml-1.5">
                  2 days ago – with{' '}
                  <a href="/bounties" className="text-[#58a6ff] hover:underline">
                    bountydotnew
                  </a>
                </span>
              </div>
            </div>
            <div className="p-4 text-sm text-[#c9d1d9]">
              <p>
                <span className="text-[#3fb950]">✓</span> Bounty created: <strong>$500</strong>
              </p>
              <p className="text-[#8b949e] text-xs mt-2">
                Submit your solution with <code className="bg-[#161b22] px-1.5 py-0.5 rounded">@bountydotnew /submit</code>{' '}
                in your PR
              </p>
            </div>
            <div className="px-4 pb-3 flex items-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <div className="flex-1 border border-[#30363d] rounded-md">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
              <div className="text-sm text-[#c9d1d9]">
                <a href="/bounties" className="font-semibold hover:text-[#58a6ff]">
                  {randomDev}
                </a>
                <span className="text-[#8b949e] ml-2">3 hours ago</span>
              </div>
            </div>
            <div className="p-4 text-sm text-[#c9d1d9]">
              <p className="mb-3">I've implemented the OAuth integration! Check out PR #47</p>
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
            <div className="border border-[#30363d] rounded-md">
              <textarea
                value="@bountydotnew /submit #47"
                readOnly
                rows={2}
                className="w-full bg-[#0d1117] px-4 py-3 text-[#c9d1d9] focus:outline-none font-mono text-sm resize-none"
              />
              <div className="bg-[#161b22] px-4 py-2 border-t border-[#30363d] flex justify-between items-center">
                <div className="text-xs text-[#8b949e]">
                  {commentSent && botReacted && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-lg">👀</span>
                      <span className="text-[#58a6ff]">@bountydotnew</span> reacted
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={commentSent}
                  className={`bg-[#238636] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    commentSent ? '' : 'animate-pulse shadow-[0_0_12px_rgba(35,134,54,0.4)]'
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
            <div className="flex-1 border border-[#30363d] rounded-md">
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d]">
                <div className="text-sm text-[#c9d1d9]">
                  <a href="/bounties" className="font-semibold hover:text-[#58a6ff]">
                    bountydotnew
                  </a>
                  <span className="inline-flex items-center gap-1 bg-[#30363d] text-[#8b949e] px-1.5 py-0.5 rounded text-xs ml-1.5 border border-[#30363d]">
                    bot
                  </span>
                  <span className="text-[#8b949e] ml-1.5">
                    just now – with{' '}
                    <a href="/bounties" className="text-[#58a6ff] hover:underline">
                      bountydotnew
                    </a>
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-[#c9d1d9]">
                <p>
                  Submission received from{' '}
                  <a href="/contributors" className="text-[#f78166] hover:underline">
                    @{randomDev}
                  </a>
                  . Waiting for maintainer approval.
                </p>
              </div>
              <div className="px-4 pb-3 flex items-center gap-2">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
    <MockBrowser initialUrl="github.com/bountydotnew/bounty.new/issues/42" headlights>
      <MockBrowser.Toolbar />
      <div className="flex-1 relative overflow-hidden">
        <MockBrowser.Page url="github.com/bountydotnew/bounty.new/issues/42">
          <GitHubIssuePage />
        </MockBrowser.Page>
      </div>
    </MockBrowser>
  );
}
