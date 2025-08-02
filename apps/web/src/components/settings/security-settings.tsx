"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePasskey } from "@/hooks/use-passkey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Laptop, Smartphone, Loader2 } from "lucide-react";
import { UAParser } from "ua-parser-js";

export function SecuritySettings() {
  const router = useRouter();
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [editingPasskey, setEditingPasskey] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  // Mock active sessions data - in real implementation this would come from API
  const [activeSessions, setActiveSessions] = useState([
    {
      id: "current-session",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      ipAddress: "192.168.1.1",
      isCurrent: true,
    },
    {
      id: "mobile-session",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: "10.0.0.1",
      isCurrent: false,
    },
  ]);

  const {
    addPasskey,
    listPasskeys,
    deletePasskey,
    updatePasskey,
    isLoading: passkeyLoading,
    error: passkeyError,
    passkeys,
  } = usePasskey();

  const removeActiveSession = (sessionId: string) => {
    setActiveSessions(sessions => sessions.filter(session => session.id !== sessionId));
  };

  const handleTerminateSession = async (session: typeof activeSessions[0]) => {
    setTerminatingSession(session.id);
    
    try {
      // In real implementation, this would call the API to revoke the session
      // const result = await authClient.revokeSession({ token: session.token });
      
      // Mock successful termination
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Session terminated successfully");
      removeActiveSession(session.id);
      
      // If terminating current session, refresh the page
      if (session.isCurrent) {
        router.refresh();
      }
    } catch (error) {
      toast.error(`Failed to terminate session: ${error}`);
    } finally {
      setTerminatingSession(null);
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
      console.error(error);
      toast.error("Failed to add passkey");
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      await deletePasskey(id);
      toast.success("Passkey deleted successfully");
    } catch (error) {
      console.error(error);
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
      console.error(error);
      toast.error("Failed to update passkey");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Passkey */}
      <Card>
        <CardHeader>
          <CardTitle>Passkey Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Add New Passkey</h4>
              <p className="text-sm text-muted-foreground">Add a new passkey to your account for secure authentication</p>
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
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">No passkeys found</p>
                <p className="text-xs text-muted-foreground">Add your first passkey above for secure authentication</p>
              </div>
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

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const parser = new UAParser(session.userAgent || "");
                const device = parser.getDevice();
                const os = parser.getOS();
                const browser = parser.getBrowser();
                const isMobile = device.type === "mobile";
                
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isMobile ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {os.name}, {browser.name}
                          </span>
                          {session.isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>IP: {session.ipAddress}</span>
                          <span>•</span>
                          <span>Last active: {formatDate(session.lastAccessedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleTerminateSession(session)}
                      disabled={terminatingSession === session.id}
                    >
                      {terminatingSession === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : session.isCurrent ? (
                        "Sign Out"
                      ) : (
                        "Terminate"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}