'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@bounty/ui';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the fee-free allowance?',
    answer:
      'The fee-free allowance is the monthly amount you can spend on bounties without any platform fee. For example, with the Basic plan ($500 allowance), you pay 0% fee on the first $500 in bounties each month.',
  },
  {
    question: 'What happens when I exceed my allowance?',
    answer:
      'When you exceed your fee-free allowance, a small platform fee is applied to amounts over the limit. The fee varies by plan: Free (5%), Basic (0%), Pro (2%), and Pro+ (4%).',
  },
  {
    question: 'Can I change plans anytime?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and you\'ll be prorated or credited accordingly.',
  },
  {
    question: 'How do bounties work?',
    answer:
      'Create a bounty by describing the task and setting a reward. Developers submit solutions, and you only pay when you approve the work. Funds are held securely until completion.',
  },
  {
    question: 'How do I get paid as a developer?',
    answer:
      'When your submission is approved, funds are automatically transferred to your connected Stripe account. Most payouts arrive within 2-3 business days.',
  },
  {
    question: 'What if no one completes my bounty?',
    answer:
      'You can cancel unfunded bounties anytime. For funded bounties, contact support to request a cancellation. Refunds are processed minus the platform fee.',
  },
];

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#2a2a2a]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left hover:opacity-90 transition-opacity"
      >
        <span className="text-[15px] text-[#efefef]">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-[#888] transition-transform duration-200 shrink-0 ml-4',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-[14px] leading-relaxed text-[#888]">{item.answer}</p>
      </div>
    </div>
  );
}

export function FooterFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-8 py-24">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left: Title */}
        <div>
          <h2 className="text-3xl font-light text-[#efefef] lg:text-4xl">
            Questions &amp; Answers
          </h2>
          <p className="mt-4 text-[#888]">
            Everything you need to know about bounty.new
          </p>
        </div>

        {/* Right: Accordion */}
        <div className="border-t border-[#2a2a2a]">
          {FAQ_ITEMS.map((item, index) => (
            <FAQAccordionItem
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
