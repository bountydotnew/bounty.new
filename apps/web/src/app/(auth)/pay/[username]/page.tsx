'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  DollarSign,
  GitFork,
  Github,
  Globe,
  Heart,
  Star,
  Twitter,
  User,
  Users,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { PaymentModal } from '@/components/payment/payment-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@bounty/ui/components/card';
import Link from '@bounty/ui/components/link';
import { Separator } from '@bounty/ui/components/separator';

interface PaymentPageProps {
  params: Promise<{ username: string }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const apiKey = searchParams.get('key');
  const username = resolvedParams.username;

  const userQuery = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      // Mock user data for now
      return {
        id: '1',
        username,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        image: `https://github.com/${username}.png`,
        bio: 'Software developer passionate about open source contributions. Building tools that make developers more productive.',
        githubUrl: `https://github.com/${username}`,
        twitterUrl:
          username !== 'example' ? `https://twitter.com/${username}` : null,
        websiteUrl: username === 'example' ? 'https://example.dev' : null,
        stats: {
          repositories: 42,
          followers: 1234,
          contributions: 567,
        },
        paymentSettings: {
          enabled: true,
          presetAmounts: [5, 10, 25, 50],
          allowCustomAmount: true,
          minAmount: 1,
          maxAmount: 1000,
        },
      };
    },
  });

  useEffect(() => {
    if (userQuery.data && apiKey && !paymentModalOpen) {
      setPaymentModalOpen(true);
    }
  }, [userQuery.data, apiKey, paymentModalOpen]);
  if (userQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8 md:py-10">
        <div className="space-y-6">
          <div className="h-8 w-24 animate-pulse rounded bg-neutral-800/50" />
          <Card className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-800/50" />
                <div className="space-y-2">
                  <div className="h-6 w-32 animate-pulse rounded bg-neutral-800/50" />
                  <div className="h-4 w-24 animate-pulse rounded bg-neutral-800/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-800/50" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800/50" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 animate-pulse rounded bg-neutral-800/50" />
                  <div className="h-16 animate-pulse rounded bg-neutral-800/50" />
                  <div className="h-16 animate-pulse rounded bg-neutral-800/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userQuery.error || !userQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8 md:py-10">
        <div className="space-y-6">
          <Button onClick={() => router.back()} size="sm" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <User className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="mb-2 text-red-500">
                User Not Found
              </CardTitle>
              <p className="mb-6 text-neutral-400">
                The user @{username} could not be found or doesn&apos;t have
                payments enabled.
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const user = userQuery.data;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:py-10">
      <div className="space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <Button onClick={() => router.back()} size="sm" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage alt={user.name} src={user.image} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <CardTitle className="text-2xl text-white">
                    {user.name}
                  </CardTitle>
                  <p className="text-neutral-400">@{user.username}</p>
                </div>
                {user.bio && (
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {user.bio}
                  </p>
                )}

                <div className="flex gap-4 pt-2">
                  {user.githubUrl && (
                    <Link
                      className="inline-flex items-center gap-2 text-neutral-300 text-sm transition-colors hover:text-white"
                      href={user.githubUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </Link>
                  )}
                  {user.twitterUrl && (
                    <Link
                      className="inline-flex items-center gap-2 text-neutral-300 text-sm transition-colors hover:text-white"
                      href={user.twitterUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </Link>
                  )}
                  {user.websiteUrl && (
                    <Link
                      className="inline-flex items-center gap-2 text-neutral-300 text-sm transition-colors hover:text-white"
                      href={user.websiteUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator className="bg-neutral-800" />

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-center">
                <div className="flex items-center justify-center text-white">
                  <GitFork className="mr-2 h-5 w-5 text-neutral-400" />
                  <p className="font-semibold text-xl">
                    {user.stats.repositories}
                  </p>
                </div>
                <p className="mt-1 text-neutral-400 text-xs">Repositories</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-center">
                <div className="flex items-center justify-center text-white">
                  <Users className="mr-2 h-5 w-5 text-neutral-400" />
                  <p className="font-semibold text-xl">
                    {user.stats.followers.toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-neutral-400 text-xs">Followers</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-center">
                <div className="flex items-center justify-center text-white">
                  <Activity className="mr-2 h-5 w-5 text-neutral-400" />
                  <p className="font-semibold text-xl">
                    {user.stats.contributions}
                  </p>
                </div>
                <p className="mt-1 text-neutral-400 text-xs">Contributions</p>
              </div>
            </div>

            <Separator className="bg-neutral-800" />

            <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-center">
              <div className="space-y-2">
                <h3 className="flex items-center justify-center gap-2 font-semibold text-lg text-white">
                  <DollarSign className="h-5 w-5 text-neutral-300" />
                  Support {user.name}
                </h3>
                <p className="text-neutral-400">
                  Show your appreciation for their open source contributions
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  className="gap-2 rounded-lg border border-neutral-800 bg-neutral-900/90 text-white backdrop-blur hover:bg-neutral-800"
                  onClick={() => setPaymentModalOpen(true)}
                  size="lg"
                >
                  <Heart className="h-4 w-4" />
                  Send Payment
                </Button>
                <Button
                  className="gap-2 rounded-lg border border-neutral-800 hover:bg-neutral-900/50"
                  onClick={() => setPaymentModalOpen(true)}
                  size="lg"
                  variant="outline"
                >
                  <Star className="h-4 w-4" />
                  Tip
                </Button>
              </div>
              <p className="text-neutral-500 text-xs">
                Secure payments processed through Bounty.new
              </p>
            </div>
          </CardContent>
        </Card>
        <PaymentModal
          allowCustomAmount={user.paymentSettings.allowCustomAmount}
          onOpenChange={setPaymentModalOpen}
          open={paymentModalOpen}
          presetAmounts={user.paymentSettings.presetAmounts}
          recipientName={user.name}
          recipientUsername={user.username}
        />
      </div>
    </div>
  );
}
