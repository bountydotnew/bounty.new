import React from 'react';

export function WaitlistSuccess() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 transition-all duration-500 ease-out animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-50 dark:bg-green-900/20 ring-8 ring-green-50/50 dark:ring-green-900/10">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        You're on the list!
      </h3>
      <p className="text-gray-500 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed">
        Thank you for joining. We're working hard to get things ready and will notify you as soon as your spot opens up.
      </p>
      <button
        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        onClick={() => window.location.reload()}
      >
        Return Home
      </button>
    </div>
  );
}
