import { useEffect, useCallback } from 'react';
import type { WebviewMessage, MessageType } from '../types';
import { vscode } from '../utils/vscode';

export function useVSCodeMessage(handler: (message: WebviewMessage) => void) {
  useEffect(() => {
    const messageHandler = (event: MessageEvent<WebviewMessage>) => {
      handler(event.data);
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [handler]);
}

export function useSendMessage() {
  return useCallback((type: MessageType, data?: Partial<WebviewMessage>) => {
    vscode.postMessage({ type, ...data });
  }, []);
}

// Alias for useVSCodeMessage
export const useMessageListener = useVSCodeMessage;
