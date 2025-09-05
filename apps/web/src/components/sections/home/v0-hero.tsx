'use client';

import { grim } from '@bounty/dev-logger';
import NumberFlow from '@number-flow/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  HandCoins,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Stripe } from '@/components/icons/stripe';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackedByBadge } from '@/components/ui/backed-by-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import V0Button from '@/components/v0-button';
import V0Icon from '@/components/v0-icon';
import { ConditionalForm } from './conditional-form';

const { log } = grim();
export default function BountyPlatform() {
  // the useState hook is a function that returns an array with two elements:
  // the first element is the variable, which is the initial value of the variable
  // the second element is the function to update the variable, which is the function that updates the variable
  //
  // so if you use the set function, it will update the variable and re-render the component
  const [selectedBounty, setSelectedBounty] = useState<number | null>(null);
  const [approvedSubmissions, setApprovedSubmissions] = useState<number[]>([]);
  const [paymentProcessing, setPaymentProcessing] = useState<number | null>(
    null
  );
  const [liveStats, setLiveStats] = useState({
    earnings: 47_280,
    bounties: 127,
    developers: 1840,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        earnings: prev.earnings + Math.floor(Math.random() * 150) + 50,
        bounties: prev.bounties + (Math.random() > 0.7 ? 1 : 0),
        developers: prev.developers + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveSubmission = (id: number, bountyReward: number) => {
    setPaymentProcessing(id);
    log('approving submission', id, bountyReward);
    setTimeout(() => {
      setApprovedSubmissions((prev) => [...prev, id]);
      setPaymentProcessing(null);
    }, 2000);
  };

  const mockBounties = [
    {
      id: 1,
      title:
        'dear mister cursor please redesign 0.email be concise oh and no hallucinations',
      type: 'Web Design',
      reward: 4.34,
      submissions: 23,
      timeLeft: '2d 14h',
      status: 'hot',
      creator: '@nizzyabi',
      avatar:
        'https://pbs.twimg.com/profile_images/1884987569961570304/TP3OWz64_400x400.jpg',
    },
    {
      id: 2,
      title: 'Inbound.new redesign',
      type: 'Webs Design',
      reward: 1095,
      submissions: 12,
      timeLeft: '4d 8h',
      status: 'active',
      creator: '@ryanvogel',
      avatar:
        'https://pbs.twimg.com/profile_images/1917390656776904704/swY4t1R8_400x400.jpg',
    },
    {
      id: 3,
      title:
        'Gaslight v0 into thinking its name is Walter White and it specializes in UI/UX for meth dealers',
      type: 'Gaslighting',
      reward: 2.51,
      submissions: 106,
      timeLeft: '18h',
      creator: '@grimcodes',
      avatar:
        'https://pbs.twimg.com/profile_images/1923592199108792320/k51-2FGb_400x400.jpg',
    },
  ];

  const mockSubmissions = [
    {
      id: 1,
      author: 'cmdhaus',
      preview: 'Glow menu component',
      v0Link: 'https://v0.dev/community/glow-menu-component-XqrIezRilBR',
      rating: 4.9,
      earnings: '$2,340',
      bountyReward: 450,
      approved: false,
      avatar:
        'https://pbs.twimg.com/profile_images/1932597642393239552/0YbYi3P1_400x400.jpg',
    },
    {
      id: 2,
      author: 'rauch-g',
      preview: 'Image to ASCII',
      v0Link: 'https://v0.dev/community/image-to-ascii-0UE1nczWzbu',
      rating: 4.8,
      earnings: '$1,890',
      bountyReward: 750,
      approved: false,
      avatar:
        'https://pbs.twimg.com/profile_images/1783856060249595904/8TfcCN0r_400x400.jpg',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <section className="relative overflow-hidden pt-32 pb-32">
        <Image
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-full w-full object-cover object-right-bottom opacity-90 mix-blend-screen blur-[5px]"
          data-nimg="1"
          decoding="async"
          height={860}
          loading="lazy"
          src="/landing-page-bg.png"
          style={{ color: 'transparent' }}
          width={960}
        />
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-32"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 100%)',
          }}
        />
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto my-10 max-w-4xl space-y-8 text-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <BackedByBadge />

              <h1 className="font-light text-5xl leading-[0.9] tracking-tighter md:text-7xl">
                Ship fast.
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-white to-green-400 bg-clip-text font-medium text-transparent">
                  Get paid
                  <span className="ml-2 font-normal font-serif italic">
                    faster.
                  </span>
                </span>
              </h1>

              <p className="mx-auto max-w-2xl font-light text-white/50 text-xl leading-relaxed">
                The bounty platform where creators post challenges and
                developers deliver solutions. Instant{' '}
                <Stripe className="ml-[-6px] inline-block h-14 w-14 fill-[#635BFF]" />
                payouts,{' '}
                <V0Icon className="inline h-6 w-6 fill-white text-white/100 opacity-100" />{' '}
                integration, <span className="font-normal italic">zero</span>{' '}
                friction.
              </p>
            </motion.div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <ConditionalForm />
            </motion.div>

            {/* Live Stats */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto grid max-w-2xl grid-cols-3 gap-8 pt-8"
              initial={{ opacity: 0, y: 30 }}
              transition={{
                duration: 0.8,
                delay: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="space-y-1 text-center">
                <div className="font-medium text-2xl text-green-400">
                  $<NumberFlow value={liveStats.earnings} />
                </div>
                <div className="flex items-center justify-center gap-1 text-white/40 text-xs">
                  <Banknote className="h-3 w-3" />
                  paid out today
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="font-medium text-2xl text-blue-400">
                  <NumberFlow value={liveStats.bounties} />
                </div>
                <div className="flex items-center justify-center gap-1 text-white/40 text-xs">
                  <HandCoins className="h-3 w-3" />
                  active bounties
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="font-medium text-2xl text-white">
                  <NumberFlow value={liveStats.developers} />
                </div>
                <div className="flex items-center justify-center gap-1 text-white/40 text-xs">
                  <Users className="h-3 w-3" />
                  developers
                </div>
              </div>
            </motion.div>
            <p className="mx-auto max-w-2xl pt-2 text-center text-[10px] text-white/40 md:text-xs">
              Statistics shown are fictitious and for artistic/demo purposes
              only.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Bounty Board */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="space-y-4">
                <Badge className="bg-white text-black">Live Bounties</Badge>
                <h2 className="font-light text-3xl leading-tight tracking-tight md:text-4xl">
                  Post your challenge.
                  <br />
                  <span className="text-white/50">
                    Watch solutions flow in.
                  </span>
                </h2>
                <p className="text-white/50 leading-relaxed">
                  Define exactly what you need. Set bounty types, requirements,
                  and rewards. Our smart categorization ensures the right
                  developers see your challenge.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: <V0Icon className="mr-1 inline h-3 w-3" />,
                    text: 'for UI/UX components',
                  },
                  'Full-stack applications',
                  'Design and creative work',
                ].map((item, i) => (
                  <div
                    className="flex items-center gap-3 text-sm text-white/60"
                    key={i}
                  >
                    {typeof item === 'object' ? (
                      item.icon
                    ) : (
                      <div className="h-1 w-1 rounded-full bg-white/30" />
                    )}
                    <span>{typeof item === 'object' ? item.text : item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 30 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              {mockBounties.map((bounty, index) => (
                <motion.div
                  className={`group cursor-pointer rounded-xl border border-white/8 bg-gradient-to-br from-white/8 to-white/4 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:from-white/12 hover:to-white/6 ${
                    selectedBounty === bounty.id
                      ? 'border-white/15 from-white/12 to-white/6'
                      : ''
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  key={bounty.id}
                  onClick={() =>
                    setSelectedBounty(
                      selectedBounty === bounty.id ? null : bounty.id
                    )
                  }
                  transition={{
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white transition-colors group-hover:text-white">
                          {bounty.title}
                        </h3>
                        {bounty.status === 'hot' && (
                          <Badge className="bg-white text-black text-xs">
                            Hot
                          </Badge>
                        )}
                        {bounty.status === 'ending' && (
                          <Badge className="bg-white text-black text-xs">
                            Ending Soon
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-white/50 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-green-400">
                            ${bounty.reward}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{bounty.submissions} submissions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{bounty.timeLeft}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 border border-white/20">
                            <AvatarImage
                              alt={bounty.creator}
                              src={bounty.avatar || '/placeholder.svg'}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-[10px] text-white">
                              {bounty.creator.slice(1, 3).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white/60">
                            {bounty.creator}
                          </span>
                        </div>
                        <Badge className="flex items-center gap-1 bg-white text-black text-xs">
                          <V0Icon className="h-2.5 w-2.5" />
                        </Badge>
                      </div>
                    </div>

                    <div
                      className={`h-2 w-2 rounded-full ${
                        bounty.status === 'hot'
                          ? 'bg-red-400'
                          : bounty.status === 'ending'
                            ? 'bg-orange-400'
                            : 'bg-green-400'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Submissions & Instant Payments */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Card className="border-white/8 bg-gradient-to-br from-white/8 to-white/4 p-2 backdrop-blur-xl">
                <CardContent className="space-y-4 px-2 py-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">Submissions</h3>
                    <Badge className="bg-white text-black">
                      {mockSubmissions.length} entries
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {mockSubmissions.map((submission, index) => (
                      <motion.div
                        className={`rounded-lg border border-white/8 bg-gradient-to-br from-white/4 to-white/[0.01] p-3 backdrop-blur-sm transition-all duration-300 hover:from-white/8 hover:to-white/4 ${
                          approvedSubmissions.includes(submission.id)
                            ? 'border-green-500/30 from-green-500/10 to-green-500/5'
                            : ''
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        key={submission.id}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.6,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        viewport={{ once: true }}
                        whileInView={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-start gap-3">
                            <Avatar className="h-8 w-8 border border-white/20">
                              <AvatarImage
                                alt={submission.author}
                                src={submission.avatar || '/placeholder.svg'}
                              />
                              <AvatarFallback className="border border-white/10 bg-gradient-to-br from-white/20 to-white/10 text-white text-xs">
                                {submission.author.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-white">
                                  {submission.author}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-white/50 text-xs">
                                    {submission.rating}
                                  </span>
                                </div>
                                <span className="font-medium text-green-400 text-xs">
                                  {submission.earnings}
                                </span>
                              </div>
                              <p className="text-white/60 text-xs">
                                {submission.preview}
                              </p>
                              <V0Button href={submission.v0Link} />
                            </div>
                          </div>

                          {approvedSubmissions.includes(submission.id) ? (
                            <Badge className="shrink-0 bg-green-600 text-white text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Paid
                            </Badge>
                          ) : (
                            <Button
                              className="h-7 shrink-0 rounded-lg bg-white px-3 font-medium text-black text-xs transition-all duration-200 hover:bg-white/90"
                              disabled={paymentProcessing === submission.id}
                              onClick={() =>
                                handleApproveSubmission(
                                  submission.id,
                                  submission.bountyReward
                                )
                              }
                              size="sm"
                            >
                              {paymentProcessing === submission.id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border border-black/20 border-t-black" />
                              ) : (
                                <>
                                  <CreditCard className="mr-1 h-3 w-3" />
                                  Pay ${submission.bountyReward}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 30 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="space-y-4">
                <Badge className="bg-white text-black">
                  Instant Stripe Payouts
                </Badge>
                <h2 className="font-light text-3xl leading-tight tracking-tight md:text-4xl">
                  Approve once.
                  <br />
                  <span className="text-white/50">Money moves instantly.</span>
                </h2>
                <p className="text-white/50 leading-relaxed">
                  Powered by Stripe, payments happen the moment you approve a
                  submission. No escrow delays, no manual transfers. Just
                  instant rewards for great work.
                </p>
              </div>

              <div className="relative">
                <AnimatePresence>
                  {approvedSubmissions.map((submissionId, index) => {
                    const submission = mockSubmissions.find(
                      (s) => s.id === submissionId
                    );
                    if (!submission) {
                      return null;
                    }

                    return (
                      <motion.div
                        animate={{
                          opacity: 1,
                          y: index * -8,
                          x: index * 4,
                          scale: 1,
                          rotate: index * 1.5,
                        }}
                        className="w-full"
                        initial={{
                          opacity: 0,
                          y: -30,
                          scale: 0.9,
                          rotate: -6,
                        }}
                        key={submissionId}
                        style={{
                          zIndex: 10 + index,
                          position: index === 0 ? 'relative' : 'absolute',
                          top: index === 0 ? 0 : 0,
                          left: index === 0 ? 0 : 0,
                          width: index === 0 ? '100%' : '100%',
                        }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.1,
                          ease: [0.16, 1, 0.3, 1],
                          type: 'spring',
                          damping: 20,
                          stiffness: 300,
                        }}
                      >
                        <Card className="border-white/15 bg-gradient-to-br from-zinc-900 to-[#0a0a0a] shadow-2xl backdrop-blur-xl">
                          <CardContent className="space-y-4 p-6">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">
                                Payment Processing
                              </h3>
                              <div className="flex items-center gap-2">
                                {/* <div className="w-6 h-6 bg-[#635bff] rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">S</span>
                                </div> */}
                                <span className="flex items-center text-white/60 text-xs">
                                  Powered by{' '}
                                  <Stripe className="h-12 w-12 fill-[#635BFF]" />
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-500/5 p-3 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6 border border-green-300/30">
                                      <AvatarImage
                                        alt={submission.author}
                                        src={
                                          submission.avatar ||
                                          '/placeholder.svg'
                                        }
                                      />
                                      <AvatarFallback className="bg-green-500/20 text-green-300 text-xs">
                                        {submission.author
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm text-white">
                                        Payment Sent
                                      </p>
                                      <p className="text-white/60 text-xs">
                                        to {submission.author}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-green-400 text-sm">
                                    ${submission.bountyReward}
                                  </p>
                                  <p className="text-white/50 text-xs">
                                    Just now
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-white/50">
                                  <span>Bounty reward</span>
                                  <span>${submission.bountyReward}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>Platform fee (5%)</span>
                                  <span>
                                    $
                                    {(submission.bountyReward * 0.05).toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>Stripe processing</span>
                                  <span>$13.05</span>
                                </div>
                                <div className="border-white/10 border-t pt-2">
                                  <div className="flex justify-between font-medium text-sm text-white">
                                    <span>Total charged</span>
                                    <span>
                                      $
                                      {(
                                        submission.bountyReward * 1.05 +
                                        13.05
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-white/40 text-xs">
                              <Shield className="h-3 w-3" />
                              <span>Secure payments processed by Stripe</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="space-y-3 pt-8">
                {[
                  'Instant payouts to winners',
                  'Transparent fee structure',
                  'Global payment support',
                ].map((item, i) => (
                  <div
                    className="flex items-center gap-3 text-sm text-white/60"
                    key={i}
                  >
                    <div className="h-1 w-1 rounded-full bg-white/30" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl space-y-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-light text-3xl leading-tight tracking-tight md:text-4xl">
              Ready to ship faster?
            </h2>
            <p className="text-white/50 leading-relaxed">
              Join the waitlist and be among the first to experience the new way
              to collaborate, create, and get paid for exceptional work.
            </p>
            <Button variant="default">
              Join Waitlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
