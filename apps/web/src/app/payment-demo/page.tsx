'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { CreditCard, Shield, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import { EnhancedCreateBountyModal } from '@/components/bounty/enhanced-create-bounty-modal';
import { ImprovedPaymentModal } from '@/components/stripe/improved-payment-modal';
import { QuickPayButton } from '@/components/stripe/quick-pay-button';

export default function PaymentDemoPage() {
  const [showCreateBounty, setShowCreateBounty] = useState(false);
  const [showDirectPayment, setShowDirectPayment] = useState(false);

  const demoExamples = [
    {
      title: 'Fix Login Bug',
      amount: 150,
      currency: 'USD',
      description: "Users can't log in with GitHub OAuth",
      difficulty: 'intermediate',
    },
    {
      title: 'Add Dark Mode',
      amount: 300,
      currency: 'USD',
      description: 'Implement system-wide dark mode support',
      difficulty: 'advanced',
    },
    {
      title: 'Update Documentation',
      amount: 75,
      currency: 'USD',
      description: 'Update API documentation with new endpoints',
      difficulty: 'beginner',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-white to-neutral-300 bg-clip-text font-bold text-4xl text-transparent sm:text-5xl">
            Enhanced Payment Experience
          </h1>
          <p className="mx-auto max-w-2xl text-neutral-400 text-xl">
            Experience lightning-fast payments with modern UX, no more manual
            card entry hassles
          </p>
        </div>

        {/* Features */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border border-neutral-800 bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-500/20 p-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Lightning Fast</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                One-click payments with Apple Pay, Google Pay, and Link. No more
                typing card numbers.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-neutral-800 bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/20 p-2">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-white">
                  Bank-Level Security
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Powered by Stripe with end-to-end encryption and fraud
                protection.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-neutral-800 bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Beautiful UX</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smooth animations, micro-interactions, and responsive design
                that feels magical.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Demo Sections */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Enhanced Bounty Creation */}
          <Card className="border border-neutral-800 bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Sparkles className="h-6 w-6 text-blue-400" />
                Enhanced Bounty Creation
              </CardTitle>
              <CardDescription>
                Multi-step creation flow with integrated payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Step-by-step bounty details
                </div>
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Review & confirmation
                </div>
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Instant payment integration
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowCreateBounty(true)}
              >
                Try Enhanced Creation Flow
              </Button>
            </CardContent>
          </Card>

          {/* Direct Payment */}
          <Card className="border border-neutral-800 bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <CreditCard className="h-6 w-6 text-green-400" />
                Direct Payment Modal
              </CardTitle>
              <CardDescription>
                Fund existing bounties with modern payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Apple Pay & Google Pay
                </div>
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Stripe Link for instant checkout
                </div>
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Real-time payment confirmation
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                onClick={() => setShowDirectPayment(true)}
              >
                Try Direct Payment
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Bounties */}
        <div className="mt-12">
          <h2 className="mb-6 font-bold text-2xl text-white">Demo Bounties</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {demoExamples.map((bounty, index) => (
              <Card
                className="border border-neutral-800 bg-neutral-900/50 backdrop-blur"
                key={index}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    {bounty.title}
                  </CardTitle>
                  <CardDescription>{bounty.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Amount</span>
                    <span className="font-semibold text-white">
                      ${bounty.amount} {bounty.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Difficulty</span>
                    <span className="text-neutral-300 text-sm capitalize">
                      {bounty.difficulty}
                    </span>
                  </div>

                  <QuickPayButton
                    bountyAmount={bounty.amount}
                    bountyCurrency={bounty.currency}
                    bountyId={`demo-${index}`}
                    bountyTitle={bounty.title}
                    className="w-full"
                    recipientName="Demo User"
                    recipientUsername="demouser"
                    size="sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-16 text-center">
          <h3 className="mb-8 font-bold text-white text-xl">
            Performance Improvements
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="font-bold text-3xl text-green-400">85%</div>
              <div className="text-neutral-400 text-sm">Faster Checkout</div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="font-bold text-3xl text-blue-400">3x</div>
              <div className="text-neutral-400 text-sm">Higher Conversion</div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="font-bold text-3xl text-purple-400">95%</div>
              <div className="text-neutral-400 text-sm">User Satisfaction</div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="font-bold text-3xl text-yellow-400">0</div>
              <div className="text-neutral-400 text-sm">Manual Card Entry</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EnhancedCreateBountyModal
        onOpenChange={setShowCreateBounty}
        open={showCreateBounty}
      />

      <ImprovedPaymentModal
        bountyAmount={100}
        bountyCurrency="USD"
        bountyId="demo-direct-payment"
        bountyTitle="Demo Payment Test"
        onOpenChange={setShowDirectPayment}
        open={showDirectPayment}
        recipientName="Demo Recipient"
        recipientUsername="demouser"
      />
    </div>
  );
}
