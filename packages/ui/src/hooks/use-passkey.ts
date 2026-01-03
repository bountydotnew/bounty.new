import { authClient } from '@bounty/auth/client';
import { useCallback, useEffect, useState } from 'react';

interface Passkey {
  id: string;
  name?: string;
  publicKey: string;
  userId: string;
  credentialID: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports?: string;
  createdAt: Date;
  aaguid?: string;
}

interface UsePasskeyReturn {
  addPasskey: (options?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
  }) => Promise<void>;
  signInWithPasskey: (options: {
    email: string;
    autoFill?: boolean;
    callbackURL?: string;
  }) => Promise<void>;
  listPasskeys: () => Promise<Passkey[]>;
  deletePasskey: (id: string) => Promise<void>;
  updatePasskey: (id: string, name: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  passkeys: Passkey[];
}

export function usePasskey(): UsePasskeyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);

  // const loadPasskeys = useCallback(async () => {
  //   try {
  //     const result = await authClient.passkey.listUserPasskeys({});
  //     if ('data' in result && result.data) {
  //       setPasskeys(result.data);
  //     }
  //   } catch (_err) {}
  // }, []);

  // useEffect(() => {
  //   loadPasskeys();
  // }, [loadPasskeys]);

  // const addPasskey = useCallback(
  //   async (options?: {
  //     authenticatorAttachment?: 'platform' | 'cross-platform';
  //   }) => {
  //     setIsLoading(true);
  //     setError(null);
  //     try {
  //       await authClient.passkey.addPasskey(options);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'Failed to add passkey');
  //       throw err;
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   },
  //   []
  // );

  // const signInWithPasskey = useCallback(
  //   async (options: {
  //     email: string;
  //     autoFill?: boolean;
  //     callbackURL?: string;
  //   }) => {
  //     setIsLoading(true);
  //     setError(null);
  //     try {
  //       await authClient.signIn.passkey(options);
  //     } catch (err) {
  //       setError(
  //         err instanceof Error ? err.message : 'Failed to sign in with passkey'
  //       );
  //       throw err;
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   },
  //   []
  // );

  // const listPasskeys = useCallback(async (): Promise<Passkey[]> => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     // @ts-expect-error - Better Auth types may not be fully updated
  //     const result = await authClient.passkey.listUserPasskeys({});
  //     if (result.data) {
  //       const passkeys = result.data as Passkey[];
  //       setPasskeys(passkeys);
  //       return passkeys;
  //     }
  //     throw new Error('Failed to fetch passkeys');
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to list passkeys');
  //     throw err;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  // const deletePasskey = useCallback(async (id: string) => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     // @ts-expect-error - Better Auth types may not be fully updated
  //     await authClient.passkey.deletePasskey({ id });
  //     setPasskeys((prev) => prev.filter((pk) => pk.id !== id));
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to delete passkey');
  //     throw err;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  // const updatePasskey = useCallback(async (id: string, name: string) => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     await authClient.passkey.updatePasskey({ id, name });
  //     setPasskeys((prev) =>
  //       prev.map((pk) => (pk.id === id ? { ...pk, name } : pk))
  //     );
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to update passkey');
  //     throw err;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  return {
    addPasskey: async () => {},
    signInWithPasskey: async () => {},
    listPasskeys: async () => [],
    deletePasskey: async () => {},
    updatePasskey: async () => {},
    isLoading: false,
    error: null,
    passkeys: [],
  };
}
