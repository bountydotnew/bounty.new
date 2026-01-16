"use client";

import { useEffect, useState } from 'react';

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

  const GmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="52 42 88 66" className="w-5 h-5">
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  );

  const StripeIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
    </svg>
  );

  return (
    <div
      className={`w-[340px] rounded-[18px] p-3 shadow-2xl transition-all duration-500 ${
        hiding ? 'opacity-0 translate-x-8' : 'animate-in slide-in-from-right-8 fade-in'
      }`}
      style={{
        background: 'linear-gradient(to bottom, rgba(58, 58, 60, 0.95), rgba(44, 44, 46, 0.95))',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {appIcon === 'gmail' ? (
            <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center overflow-hidden p-2">
              <GmailIcon />
            </div>
          ) : appIcon === 'stripe' ? (
            <div className="w-10 h-10 rounded-[10px] bg-[#635BFF] flex items-center justify-center">
              <StripeIcon />
            </div>
          ) : (
            <img src={appIcon || '/placeholder.svg'} alt={appName} className="w-10 h-10 rounded-[10px]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[13px] font-semibold text-white/90">{appName}</span>
            <span className="text-[11px] text-white/50">{time}</span>
          </div>
          <p className="text-[13px] font-medium text-white truncate mb-0.5">{title}</p>
          <p className="text-[12px] text-white/70 line-clamp-2 leading-snug">{message}</p>
        </div>
      </div>
    </div>
  );
}
