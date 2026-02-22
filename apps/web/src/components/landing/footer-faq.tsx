'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@bounty/ui';
import { FAQ_ITEMS, type FAQCategory, type FAQItem } from '@bounty/ui/lib/faqs';

const FAQ_CATEGORIES: { value: FAQCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'payments', label: 'Payments' },
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
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
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
