"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@bounty/auth/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings } from "lucide-react";
import { LINKS } from "@/constants/links";

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const [isClientMounted, setIsClientMounted] = useState(false);

    const { data: session, isPending: loading } = authClient.useSession();
    const isOwnProfile = username === "me";

    // Prevent hydration mismatch by ensuring client-side rendering
    useEffect(() => {
        setIsClientMounted(true);
    }, []);

    // Redirect to settings for own profile
    useEffect(() => {
        if (isClientMounted && isOwnProfile && session) {
            router.replace(LINKS.SETTINGS);
        }
    }, [isClientMounted, isOwnProfile, session, router]);

    // Don't render until client is mounted to prevent hydration issues
    if (!isClientMounted) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="p-6">
                        <Loader2 className="animate-spin" size={24} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!session && loading) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="p-6">
                        <Loader2 className="animate-spin" size={24} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="p-6">
                        <p>Please sign in to view profiles.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If this is the user's own profile (/profile/me), redirect to settings
    if (isOwnProfile) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="p-6 text-center">
                        <Settings className="mx-auto mb-4" size={48} />
                        <h2 className="text-xl font-semibold mb-2">Redirecting to Settings</h2>
                        <p className="text-muted-foreground mb-4">
                          Your account settings have been moved to a dedicated page.
                        </p>
                        <Button onClick={() => router.replace(LINKS.SETTINGS)}>
                          Go to Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // For non-"me" usernames, show a simple profile view
    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Profile: @{username}</CardTitle>
                    <CardDescription>Public user profile</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Avatar className="mx-auto mb-4 h-16 w-16">
                            <AvatarImage src={`https://github.com/${username}.png`} alt={username} />
                            <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-semibold mb-2">@{username}</h3>
                        <p className="text-muted-foreground mb-4">
                            Public profiles are not yet fully implemented.
                        </p>
                        <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}