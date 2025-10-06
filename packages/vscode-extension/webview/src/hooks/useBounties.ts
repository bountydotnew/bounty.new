import { useState, useCallback, useEffect } from 'react';
import { useVSCodeMessage, useSendMessage } from './use-vscode-message';
import type { Bounty, FetchBountiesParams, WebviewMessage } from '../types';

export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sendMessage = useSendMessage();

  useVSCodeMessage(
    useCallback((message: WebviewMessage) => {
      switch (message.type) {
        case 'bountiesLoaded':
          setBounties(message.bounties || []);
          setIsLoading(false);
          setError(null);
          break;
        case 'error':
          setError(message.message || 'An error occurred');
          setIsLoading(false);
          break;
      }
    }, [])
  );

  const fetchBounties = useCallback(
    (params?: FetchBountiesParams) => {
      setIsLoading(true);
      setError(null);
      sendMessage('fetchBounties', { params });
    },
    [sendMessage]
  );

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    sendMessage('fetchBounties', { params: undefined });
  }, [sendMessage]);

  // Fetch bounties on mount only
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    sendMessage('fetchBounties', { params: undefined });
  }, [sendMessage]);

  return {
    bounties,
    isLoading,
    error,
    fetchBounties,
    refresh,
  };
}
