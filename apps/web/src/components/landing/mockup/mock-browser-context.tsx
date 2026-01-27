"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface MockBrowserState {
  currentUrl: string;
  history: string[];
  historyIndex: number;
  isNavigating: boolean;
  loadingProgress: number; // 0-100
  compact: boolean; // Compact mode for mobile
}

interface MockBrowserContextValue extends MockBrowserState {
  navigate: (url: string) => void;
  back: () => void;
  forward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const MockBrowserContext = createContext<MockBrowserContextValue | null>(null);

interface MockBrowserProviderProps {
  initialUrl: string;
  children: ReactNode;
  compact?: boolean;
}

export function MockBrowserProvider({ initialUrl, children, compact = false }: MockBrowserProviderProps) {
  const [state, setState] = useState<MockBrowserState>({
    currentUrl: initialUrl,
    history: [initialUrl],
    historyIndex: 0,
    isNavigating: false,
    loadingProgress: 0,
    compact,
  });

  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate realistic browser loading progress
  const startLoading = useCallback(() => {
    // Clear any existing timers
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setState((prev) => ({ ...prev, isNavigating: true, loadingProgress: 0 }));

    // Phase 1: Quick initial progress (0-30%)
    let progress = 0;
    loadingIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 30) {
        progress = 30;
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
        }

        // Phase 2: Slow middle progress (30-70%)
        loadingIntervalRef.current = setInterval(() => {
          progress += Math.random() * 8 + 2;
          if (progress >= 70) {
            progress = 70;
            if (loadingIntervalRef.current) {
              clearInterval(loadingIntervalRef.current);
            }

            // Phase 3: Very slow crawl (70-90%)
            loadingIntervalRef.current = setInterval(() => {
              progress += Math.random() * 3 + 1;
              if (progress >= 90) {
                progress = 90;
                if (loadingIntervalRef.current) {
                  clearInterval(loadingIntervalRef.current);
                }
              }
              setState((prev) => ({ ...prev, loadingProgress: Math.min(progress, 90) }));
            }, 100);
          }
          setState((prev) => ({ ...prev, loadingProgress: Math.min(progress, 70) }));
        }, 80);
      }
      setState((prev) => ({ ...prev, loadingProgress: Math.min(progress, 30) }));
    }, 50);
  }, []);

  const finishLoading = useCallback(() => {
    // Clear any existing timers
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Quick finish animation (90-100%)
    setState((prev) => ({ ...prev, loadingProgress: 100 }));

    // Hide after complete
    loadingTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isNavigating: false, loadingProgress: 0 }));
    }, 200);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const navigate = useCallback((url: string) => {
    startLoading();

    setState((prev) => {
      const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), url];
      return {
        ...prev,
        currentUrl: url,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });

    // Simulate network delay then finish loading
    const delay = 400 + Math.random() * 300;
    loadingTimeoutRef.current = setTimeout(finishLoading, delay);
  }, [startLoading, finishLoading]);

  const back = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) {
        return prev;
      }
      startLoading();
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        currentUrl: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });

    const delay = 300 + Math.random() * 200;
    loadingTimeoutRef.current = setTimeout(finishLoading, delay);
  }, [startLoading, finishLoading]);

  const forward = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) {
        return prev;
      }
      startLoading();
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        currentUrl: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });

    const delay = 300 + Math.random() * 200;
    loadingTimeoutRef.current = setTimeout(finishLoading, delay);
  }, [startLoading, finishLoading]);

  const value = useMemo<MockBrowserContextValue>(
    () => ({
      ...state,
      navigate,
      back,
      forward,
      canGoBack: state.historyIndex > 0,
      canGoForward: state.historyIndex < state.history.length - 1,
    }),
    [state, navigate, back, forward]
  );

  return (
    <MockBrowserContext.Provider value={value}>{children}</MockBrowserContext.Provider>
  );
}

export function useMockBrowser(): MockBrowserContextValue {
  const context = useContext(MockBrowserContext);
  if (!context) {
    throw new Error('useMockBrowser must be used within a MockBrowser');
  }
  return context;
}
