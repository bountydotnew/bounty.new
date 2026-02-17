'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const GmailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="52 42 88 66"
    className="w-5 h-5"
  >
    <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
    <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
    <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
    <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
    <path
      fill="#c5221f"
      d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
    />
  </svg>
);

const StripeIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
  </svg>
);

const GitHubIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className="w-5 h-5 text-foreground"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

export function MacNotification({
  appIcon,
  appName,
  title,
  message,
  time,
  delay,
}: {
  appIcon: string;
  appName: string;
  title: string;
  message: string;
  time: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(showTimer);
  }, [delay]);

  useEffect(() => {
    if (visible) {
      const hideTimer = setTimeout(() => setHiding(true), 4000);
      return () => clearTimeout(hideTimer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`w-[340px] rounded-[18px] p-3 shadow-2xl transition-all duration-500 ${
        hiding
          ? 'opacity-0 translate-x-8'
          : 'animate-in slide-in-from-right-8 fade-in'
      }`}
      style={{
        background:
          'linear-gradient(to bottom, var(--surface-3), var(--surface-2))',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {appIcon === 'gmail' ? (
            <div className="w-10 h-10 rounded-[10px] bg-surface-1 border border-border-subtle flex items-center justify-center overflow-hidden p-2">
              <GmailIcon />
            </div>
          ) : appIcon === 'stripe' ? (
            <div className="w-10 h-10 rounded-[10px] bg-info flex items-center justify-center">
              <StripeIcon />
            </div>
          ) : appIcon === 'github' ? (
            <div className="w-10 h-10 rounded-[10px] bg-gh-surface flex items-center justify-center">
              <GitHubIcon />
            </div>
          ) : (
            <Image
              src={appIcon || '/placeholder.svg'}
              alt={appName}
              className="w-10 h-10 rounded-[10px]"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[13px] font-semibold text-foreground/90">
              {appName}
            </span>
            <span className="text-[11px] text-text-muted">{time}</span>
          </div>
          <p className="text-[13px] font-medium text-foreground truncate mb-0.5">
            {title}
          </p>
          <p className="text-[12px] text-text-secondary line-clamp-2 leading-snug">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
