'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@bounty/ui';

interface FAQItem {
  question: string;
  answer: string;
}

type FAQCategory = 'general' | 'pricing' | 'payments';

const FAQ_CATEGORIES: { value: FAQCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'payments', label: 'Payments' },
];

const FAQ_ITEMS: Record<FAQCategory, FAQItem[]> = {
  general: [
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
  ],
  pricing: [
    {
      question: 'What is the fee-free allowance?',
      answer:
        'The fee-free allowance is the monthly amount you can spend on bounties without any platform fee. For example, with the Basic plan ($500 allowance), you pay 0% platform fee on the first $500 in bounties each month. (Stripe fees still apply).',
    },
    {
      question: 'What happens when I exceed my allowance?',
      answer:
        'When you exceed your fee-free allowance, a small platform fee is applied to amounts over the limit. The fee varies by plan: Free (5%), Basic (4%), Pro (3%), and Pro+ (2%).',
    },
    {
      question: 'Can I change plans anytime?',
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be prorated or credited accordingly.",
    },
  ],
  payments: [
    {
      question: 'What is Stripe Connect?',
      answer:
        'Stripe Connect is a secure payment platform that allows you to receive bounty payouts directly to your bank account. It handles all the payment processing, tax reporting, and compliance requirements so you can focus on solving bounties.',
    },
    {
      question: 'Why do I need Stripe Connect?',
      answer:
        'To receive payouts as a bounty solver, you need a connected Stripe account. This ensures secure, direct transfers to your bank account when your solutions are approved. Without it, we have no way to send you your earnings.',
    },
    {
      question: 'Why is my SSN or Tax ID required?',
      answer:
        'Stripe requires identity verification to comply with financial regulations and prevent fraud. Your SSN or Tax ID is used to verify your identity and for tax reporting purposes (1099 forms in the US). This information is securely handled by Stripe and never stored on our servers.',
    },
    {
      question: 'Is my information secure?',
      answer:
        'Yes. All sensitive information is handled directly by Stripe, a PCI-compliant payment processor trusted by millions of businesses. We never see or store your SSN, bank account details, or other sensitive financial information.',
    },
    {
      question: 'How long do payouts take?',
      answer:
        'Once your solution is approved, payouts typically arrive in your bank account within 2-3 business days. The exact timing depends on your bank and country.',
    },
  ],
};

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
    <div className="border-b border-border-default">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left hover:opacity-90 transition-opacity"
      >
        <span className="text-[15px] text-foreground">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-text-muted transition-transform duration-200 shrink-0 ml-4',
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
        <p className="text-[14px] leading-relaxed text-text-muted">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export function FooterFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('general');

  const currentFAQs = FAQ_ITEMS[activeCategory];

  // Reset open index when category changes
  const handleCategoryChange = (category: FAQCategory) => {
    setActiveCategory(category);
    setOpenIndex(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-8 py-24">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left: Title + Category Selector */}
        <div>
          <h2 className="text-3xl font-medium text-foreground lg:text-4xl">
            Questions &amp; Answers
          </h2>
          <p className="mt-4 text-text-muted">
            Everything you need to know about bounty.new
          </p>

          {/* Category Selector - matching roadmap style */}
          <div className="mt-6 inline-flex w-fit rounded-full bg-surface-1 border border-border-subtle p-1">
            {FAQ_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryChange(category.value)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.value
                    ? 'bg-surface-3 text-foreground'
                    : 'text-text-tertiary hover:text-foreground'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Accordion */}
        <div className="border-t border-border-default">
          {currentFAQs.map((item, index) => (
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
