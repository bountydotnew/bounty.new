"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { authClient } from "@bounty/auth/client";
import { usePasskey } from "@/hooks/use-passkey";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const [newPasskeyName, setNewPasskeyName] = useState("");
    const [editingPasskey, setEditingPasskey] = useState<{ id: string; name: string } | null>(null);
    const [editName, setEditName] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isClientMounted, setIsClientMounted] = useState(false);

    const { data: session, isPending: loading } = authClient.useSession();

    const {
        addPasskey,
        listPasskeys,
        deletePasskey,
        updatePasskey,
        isLoading: passkeyLoading,
        error: passkeyError,
        passkeys,
    } = usePasskey();

    const isOwnProfile = username === "me";

    // Prevent hydration mismatch by ensuring client-side rendering
    useEffect(() => {
        setIsClientMounted(true);
    }, []);

    // Don't render until client is mounted to prevent hydration issues
    if (!isClientMounted) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="p-6">
                        <Loader2
                            className="animate-spin"
                            size={24}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            window.location.href = "/";
        } catch (error) {
            toast.error("Failed to sign out");
        }
    };

    const handleAddPasskey = async (authenticatorAttachment?: "platform" | "cross-platform") => {
        try {
            await addPasskey({ authenticatorAttachment });
            toast.success("Passkey added successfully");
            listPasskeys();
            setIsAddDialogOpen(false);
            setNewPasskeyName("");
        } catch (error) {
            toast.error("Failed to add passkey");
        }
    };

    const handleDeletePasskey = async (id: string) => {
        try {
            await deletePasskey(id);
            toast.success("Passkey deleted successfully");
        } catch (error) {
            toast.error("Failed to delete passkey");
        }
    };

    const handleUpdatePasskey = async () => {
        if (!editingPasskey || !editName.trim()) return;

        try {
            await updatePasskey(editingPasskey.id, editName);
            toast.success("Passkey updated successfully");
            setEditingPasskey(null);
            setEditName("");
            setIsEditDialogOpen(false);
        } catch (error) {
            toast.error("Failed to update passkey");
        }
    };

    if (!session && loading) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="p-6">
                       <Loader2
                           className="animate-spin"
                           size={24}
                       />
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
                        <p>Please sign in to view your account.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // For non-"me" usernames, show a simple profile view
    if (!isOwnProfile) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile: @{username}</CardTitle>
                        <CardDescription>User profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                Public profiles are not yet implemented.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || session?.user?.email} />
                            <AvatarFallback>{session?.user?.name?.[0] || session?.user?.email[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">{session?.user?.name || "No name set"}</h3>
                            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                            <Badge variant="secondary">User ID: {session?.user?.id}</Badge>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium">Sign Out</h4>
                            <p className="text-sm text-muted-foreground">Sign out of your account</p>
                        </div>
                        <Button variant="outline" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Passkeys</CardTitle>
                    <CardDescription>Manage your passkeys for secure authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium">Add New Passkey</h4>
                            <p className="text-sm text-muted-foreground">Add a new passkey to your account</p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddDialogOpen(true)}>Add Passkey</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Passkey</DialogTitle>
                                    <DialogDescription>
                                        Choose the type of authenticator you want to register
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="passkey-name">Passkey Name (Optional)</Label>
                                        <Input
                                            id="passkey-name"
                                            placeholder="e.g., iPhone, MacBook, Security Key"
                                            value={newPasskeyName}
                                            onChange={(e) => setNewPasskeyName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => handleAddPasskey("platform")}
                                            disabled={passkeyLoading}
                                            className="flex-1"
                                        >
                                            Platform (Fingerprint/Face ID)
                                        </Button>
                                        <Button
                                            onClick={() => handleAddPasskey("cross-platform")}
                                            disabled={passkeyLoading}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Security Key
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h4 className="font-medium">Your Passkeys ({passkeys.length})</h4>
                        {passkeyError && (
                            <p className="text-sm text-red-600">{passkeyError}</p>
                        )}

                        {passkeys.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No passkeys found. Add your first passkey above.</p>
                        ) : (
                            <div className="space-y-2">
                                {passkeys.map((passkey) => (
                                    <div key={passkey.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-1">
                                            <p className="font-medium">{passkey.name || "Unnamed Passkey"}</p>
                                            <div className="flex space-x-2 text-xs text-muted-foreground">
                                                <span>Device: {passkey.deviceType || "Unknown"}</span>
                                                <span>•</span>
                                                <span>Backed up: {passkey.backedUp ? "Yes" : "No"}</span>
                                                <span>•</span>
                                                <span>Created: {formatDate(passkey.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingPasskey({ id: passkey.id, name: passkey.name || "" });
                                                            setEditName(passkey.name || "");
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Passkey Name</DialogTitle>
                                                        <DialogDescription>
                                                            Update the name for your passkey
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="edit-name">Passkey Name</Label>
                                                            <Input
                                                                id="edit-name"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                placeholder="Enter passkey name"
                                                            />
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button onClick={handleUpdatePasskey} disabled={!editName.trim()}>
                                                                Update
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setEditingPasskey(null);
                                                                    setEditName("");
                                                                    setIsEditDialogOpen(false);
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeletePasskey(passkey.id)}
                                                disabled={passkeyLoading}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}