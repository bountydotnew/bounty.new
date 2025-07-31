"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PaymentModal } from "@/components/payment/payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Github, Twitter, Globe, DollarSign, Heart, Star, User, GitFork, Users, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  // TODO: Replace with actual user query
  const userQuery = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      // Mock user data for now
      return {
        id: '1',
        username: username,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        image: `https://github.com/${username}.png`,
        bio: 'Software developer passionate about open source contributions. Building tools that make developers more productive.',
        githubUrl: `https://github.com/${username}`,
        twitterUrl: username !== 'example' ? `https://twitter.com/${username}` : null,
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
        }
      };
    },
  });

  // Auto-open payment modal when landing from external source
  useEffect(() => {
    if (userQuery.data && apiKey && !paymentModalOpen) {
      setPaymentModalOpen(true);
    }
  }, [userQuery.data, apiKey, paymentModalOpen]);
  if (userQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 bg-muted rounded animate-pulse" />
                  <div className="h-16 bg-muted rounded animate-pulse" />
                  <div className="h-16 bg-muted rounded animate-pulse" />
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="mb-2 text-red-600">User Not Found</CardTitle>
              <p className="text-muted-foreground mb-6">
                The user @{username} could not be found or doesn&apos;t have payments enabled.
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Heart className="w-3 h-3" />
            Payment Profile
          </Badge>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                {user.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
                )}
                
                {/* Social Links */}
                <div className="flex gap-4 pt-2">
                  {user.githubUrl && (
                    <Link 
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </Link>
                  )}
                  {user.twitterUrl && (
                    <Link 
                      href={user.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Link>
                  )}
                  {user.websiteUrl && (
                    <Link 
                      href={user.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Separator />
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <GitFork className="w-5 h-5 text-muted-foreground mr-2" />
                  <p className="text-2xl font-bold">{user.stats.repositories}</p>
                </div>
                <p className="text-sm text-muted-foreground">Repositories</p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground mr-2" />
                  <p className="text-2xl font-bold">{user.stats.followers.toLocaleString()}</p>
                </div>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <Activity className="w-5 h-5 text-muted-foreground mr-2" />
                  <p className="text-2xl font-bold">{user.stats.contributions}</p>
                </div>
                <p className="text-sm text-muted-foreground">Contributions</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Payment CTA */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Support {user.name}
                </h3>
                <p className="text-muted-foreground">
                  Show your appreciation for their open source contributions
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setPaymentModalOpen(true)}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Send Payment
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => setPaymentModalOpen(true)}
                  className="gap-2"
                >
                  <Star className="w-4 h-4" />
                  Tip
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Secure payments processed through Bounty.new
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modal */}
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          recipientName={user.name}
          recipientUsername={user.username}
          presetAmounts={user.paymentSettings.presetAmounts}
          allowCustomAmount={user.paymentSettings.allowCustomAmount}
        />
      </div>
    </div>
  );
}