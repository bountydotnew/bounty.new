/**
 * Centralized FAQ Data
 *
 * This is the single source of truth for all FAQ content across the app.
 * Edit these FAQs here and they will sync everywhere.
 *
 * Categories:
 * - payments: For payment settings page and footer FAQ
 * - general: General bounty questions
 * - pricing: Pricing and plan questions
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export type FAQCategory = 'general' | 'pricing' | 'payments';

/**
 * Payment FAQ Items
 * Used in: Payment settings page, Footer FAQ (payments category)
 */
export const PAYMENTS_FAQ_ITEMS: FAQItem[] = [
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
      'Once your PR is merged and approved, payouts are released within 2-3 business days while funds clear from the original payment. The exact timing depends on the original payment method and your bank. Card payments typically take 2-3 business days to clear; bank transfers may take longer. You\'ll receive a notification when your payout is processed.',
  },
  {
    question: 'Why is there a delay for payouts?',
    answer:
      'When a bounty is funded, the payment goes through a standard pending period (2-3 business days for cards) before the funds are available for payout. This is a standard banking requirement to prevent fraud and ensure payment security. The bounty is pre-funded before work begins, so the funds are guaranteed—we just need to wait for the banking system to clear them.',
  },
];

/**
 * General FAQ Items
 * Used in: Footer FAQ (general category)
 */
export const GENERAL_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do bounties work?',
    answer:
      'Create a bounty by describing the task and setting a reward. Developers submit solutions, and you only pay when you approve the work. Funds are held securely until completion.',
  },
  {
    question: 'How do I get paid as a developer?',
    answer:
      'When your submission is approved and the PR is merged, your payout is released within 2-3 business days while funds clear from the original payment. You need a connected Stripe account to receive payouts.',
  },
  {
    question: 'What if no one completes my bounty?',
    answer:
      'You can cancel unfunded bounties anytime. For funded bounties, contact support to request a cancellation. Refunds are processed minus the platform fee.',
  },
];

/**
 * Pricing FAQ Items
 * Used in: Footer FAQ (pricing category)
 */
export const PRICING_FAQ_ITEMS: FAQItem[] = [
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
];

/**
 * All FAQ items by category
 * Used in: Footer FAQ component
 */
export const FAQ_ITEMS: Record<FAQCategory, FAQItem[]> = {
  general: GENERAL_FAQ_ITEMS,
  pricing: PRICING_FAQ_ITEMS,
  payments: PAYMENTS_FAQ_ITEMS,
};
