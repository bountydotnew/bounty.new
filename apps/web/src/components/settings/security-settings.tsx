'use client';

import { Laptop, Loader2, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { usePasskey } from '@/hooks/use-passkey';
import { formatDate } from '@/lib/utils';

export function SecuritySettings() {
  const router = useRouter();
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [editingPasskey, setEditingPasskey] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(
    null
  );

  // Mock active sessions data - in real implementation this would come from API
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'current-session',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      ipAddress: '192.168.1.1',
      isCurrent: true,
    },
    {
      id: 'mobile-session',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '10.0.0.1',
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
    setActiveSessions((sessions) =>
      sessions.filter((session) => session.id !== sessionId)
    );
  };

  const handleTerminateSession = async (
    session: (typeof activeSessions)[0]
  ) => {
    setTerminatingSession(session.id);

    try {
      // In real implementation, this would call the API to revoke the session
      // const result = await authClient.revokeSession({ token: session.token });

      // Mock successful termination
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Session terminated successfully');
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

  const handleAddPasskey = async (
    authenticatorAttachment?: 'platform' | 'cross-platform'
  ) => {
    try {
      await addPasskey({ authenticatorAttachment });
      toast.success('Passkey added successfully');
      listPasskeys();
      setIsAddDialogOpen(false);
      setNewPasskeyName('');
    } catch (_error) {
      toast.error('Failed to add passkey');
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      await deletePasskey(id);
      toast.success('Passkey deleted successfully');
    } catch (_error) {
      toast.error('Failed to delete passkey');
    }
  };

  const handleUpdatePasskey = async () => {
    if (!(editingPasskey && editName.trim())) {
      return;
    }

    try {
      await updatePasskey(editingPasskey.id, editName);
      toast.success('Passkey updated successfully');
      setEditingPasskey(null);
      setEditName('');
      setIsEditDialogOpen(false);
    } catch (_error) {
      toast.error('Failed to update passkey');
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
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Add New Passkey</h4>
              <p className="text-muted-foreground text-sm">
                Add a new passkey to your account for secure authentication
              </p>
            </div>
            <Dialog onOpenChange={setIsAddDialogOpen} open={isAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Add Passkey
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md gap-4" showOverlay>
                <DialogHeader>
                  <DialogTitle>Add New Passkey</DialogTitle>
                  <DialogDescription>
                    Choose the type of authenticator you want to register
                  </DialogDescription>
                </DialogHeader>
                <div className="gap-4 space-y-4">
                  <div>
                    <Label className="mt-4" htmlFor="passkey-name">
                      Passkey Name (Optional)
                    </Label>
                    <Input
                      className="mt-2"
                      id="passkey-name"
                      onChange={(e) => setNewPasskeyName(e.target.value)}
                      placeholder="e.g., iPhone, MacBook, Security Key"
                      value={newPasskeyName}
                    />
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      className="flex-1"
                      disabled={passkeyLoading}
                      onClick={() => handleAddPasskey('platform')}
                    >
                      Platform (Fingerprint/Face ID)
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={passkeyLoading}
                      onClick={() => handleAddPasskey('cross-platform')}
                      variant="outline"
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
              <p className="text-red-600 text-sm">{passkeyError}</p>
            )}

            {passkeys.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <p className="mb-2 text-muted-foreground text-sm">
                  No passkeys found
                </p>
                <p className="text-muted-foreground text-xs">
                  Add your first passkey above for secure authentication
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {passkeys.map((passkey) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={passkey.id}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {passkey.name || 'Unnamed Passkey'}
                      </p>
                      <div className="flex space-x-2 text-muted-foreground text-xs">
                        <span>Device: {passkey.deviceType || 'Unknown'}</span>
                        <span>•</span>
                        <span>
                          Backed up: {passkey.backedUp ? 'Yes' : 'No'}
                        </span>
                        <span>•</span>
                        <span>Created: {formatDate(passkey.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog
                        onOpenChange={setIsEditDialogOpen}
                        open={isEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setEditingPasskey({
                                id: passkey.id,
                                name: passkey.name || '',
                              });
                              setEditName(passkey.name || '');
                              setIsEditDialogOpen(true);
                            }}
                            size="sm"
                            variant="outline"
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
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Enter passkey name"
                                value={editName}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                disabled={!editName.trim()}
                                onClick={handleUpdatePasskey}
                              >
                                Update
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingPasskey(null);
                                  setEditName('');
                                  setIsEditDialogOpen(false);
                                }}
                                variant="outline"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        disabled={passkeyLoading}
                        onClick={() => handleDeletePasskey(passkey.id)}
                        size="sm"
                        variant="destructive"
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
            <p className="text-muted-foreground text-sm">
              No active sessions found.
            </p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const parser = new UAParser(session.userAgent || '');
                const device = parser.getDevice();
                const os = parser.getOS();
                const browser = parser.getBrowser();
                const isMobile = device.type === 'mobile';

                return (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={session.id}
                  >
                    <div className="flex items-center gap-3">
                      {isMobile ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {os.name}, {browser.name}
                          </span>
                          {session.isCurrent && (
                            <Badge className="text-xs" variant="secondary">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>IP: {session.ipAddress}</span>
                          <span>•</span>
                          <span>
                            Last active: {formatDate(session.lastAccessedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      disabled={terminatingSession === session.id}
                      onClick={() => handleTerminateSession(session)}
                      size="sm"
                      variant="destructive"
                    >
                      {terminatingSession === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : session.isCurrent ? (
                        'Sign Out'
                      ) : (
                        'Terminate'
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
