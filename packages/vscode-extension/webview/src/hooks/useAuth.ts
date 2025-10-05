import { useState, useCallback } from 'react';
import { useVSCodeMessage, useSendMessage } from './useVSCodeMessage';
import type { WebviewMessage } from '../types';

export function useAuth() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const sendMessage = useSendMessage();

  useVSCodeMessage(
    useCallback((message: WebviewMessage) => {
      switch (message.type) {
        case 'loginStarted':
          setIsLoggingIn(true);
          setLoginError(null);
          break;
        case 'loginError':
          setIsLoggingIn(false);
          setLoginError(message.message || 'Login failed');
          break;
      }
    }, [])
  );

  const login = useCallback(() => {
    setLoginError(null);
    sendMessage('login');
  }, [sendMessage]);

  const logout = useCallback(() => {
    sendMessage('logout');
  }, [sendMessage]);

  return {
    isLoggingIn,
    loginError,
    login,
    logout,
  };
}
