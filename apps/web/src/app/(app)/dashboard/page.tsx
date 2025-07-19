"use client"
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const bounties = useQuery(trpc.bounties.getAll.queryOptions({ page: 1, limit: 10 }));
  const myBounties = useQuery(trpc.bounties.getAll.queryOptions({ page: 1, limit: 5 }));

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-4 rounded-lg">
        {/* <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user.name}</p>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-8rem)] rounded-lg py-4">
          {/* Left Sidebar - My Bounties Activity */}
          {/* <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    My Bounties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myBounties.isLoading && (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {myBounties.data?.data?.slice(0, 5).map((bounty) => (
                    <div key={bounty.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">{bounty.title}</h4>
                        <Badge variant={bounty.status === 'open' ? 'default' : 'secondary'}>
                          {bounty.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        ${bounty.amount}
                      </div>
                      <Separator />
                    </div>
                  ))}

                  {myBounties.data?.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No bounties created yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div> */}

          {/* Center - Bounties Feed */}
          <div className="lg:col-span-2 lg:overflow-y-auto lg:h-full rounded-lg">
            <div className="lg:pr-2">
            <Card>
              <CardHeader>
                <CardTitle>All Bounties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bounties.isLoading && (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse border rounded-lg p-4">
                          <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
                          <div className="h-4 bg-muted rounded w-full mb-2"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {bounties.isError && (
                    <div className="text-center py-8">
                      <p className="text-destructive">Error: {bounties.error.message}</p>
                    </div>
                  )}

                  {bounties.data?.data.map((bounty) => (
                    <Card key={bounty.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{bounty.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={bounty.status === 'open' ? 'default' : 'secondary'}>
                              {bounty.status}
                            </Badge>
                            <div className="text-lg font-bold text-primary">
                              ${bounty.amount}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-3">{bounty.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(bounty.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {bounty.creator?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {bounty.creator?.name || 'Anonymous'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Right Sidebar - Recent Activity & Recommendations */}
          <div className="lg:col-span-1 lg:overflow-y-auto lg:h-full rounded-lg">
            <div className="space-y-6 lg:pr-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded-full">
                        <MessageSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">New comment on bounty</p>
                        <p className="text-xs text-muted-foreground truncate">Build a React component...</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full">
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">Bounty completed</p>
                        <p className="text-xs text-muted-foreground truncate">API integration task</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-1 rounded-full">
                        <DollarSign className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">Payment received</p>
                        <p className="text-xs text-muted-foreground truncate">$500 for mobile app bug fix</p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-1">Frontend React Task</h4>
                      <p className="text-xs text-muted-foreground mb-2">Build responsive dashboard</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">React</Badge>
                        <span className="text-sm font-medium text-primary">$300</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-1">API Integration</h4>
                      <p className="text-xs text-muted-foreground mb-2">Connect payment gateway</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">Node.js</Badge>
                        <span className="text-sm font-medium text-primary">$450</span>
                      </div>
                    </div>

                    {/* <div className="border rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-1">UI/UX Design</h4>
                      <p className="text-xs text-muted-foreground mb-2">Mobile app wireframes</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">Design</Badge>
                        <span className="text-sm font-medium text-primary">$200</span>
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    My Bounties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myBounties.isLoading && (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {myBounties.data?.data?.slice(0, 3).map((bounty) => (
                    <div key={bounty.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">{bounty.title}</h4>
                        <Badge variant={bounty.status === 'open' ? 'default' : 'secondary'}>
                          {bounty.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        ${bounty.amount}
                      </div>
                      <Separator />
                    </div>
                  ))}

                  {myBounties.data?.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No bounties created yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
