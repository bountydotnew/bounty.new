interface PostHog {
  captureException: (error: Error) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
}

interface PostHogWindow extends Window {
  posthog?: PostHog;
}

const isPostHogAvailable = (): PostHog | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const posthogWindow = window as PostHogWindow;
  const posthog = posthogWindow.posthog;

  if (
    !posthog ||
    typeof posthog.capture !== 'function' ||
    typeof posthog.captureException !== 'function'
  ) {
    return null;
  }

  return posthog;
};

const serializeMessage = (args: unknown[]): string => {
  try {
    return args
      .map((arg) => {
        if (arg === null) {
          return 'null';
        }
        if (arg === undefined) {
          return 'undefined';
        }
        if (typeof arg === 'string') {
          return arg;
        }
        if (typeof arg === 'number' || typeof arg === 'boolean') {
          return String(arg);
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return '[Object]';
          }
        }
        return String(arg);
      })
      .join(' ');
  } catch {
    return '[Serialization Error]';
  }
};

const sendToPostHog = (args: unknown[], type: string) => {
  try {
    const posthog = isPostHogAvailable();
    if (!posthog) {
      return;
    }

    const message = serializeMessage(args);

    if (type === 'error') {
      posthog.captureException(new Error(message));
    } else {
      posthog.capture('grim_log', {
        level: type,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (_error) {}
};

export const grim = () => ({
  log: (...args: unknown[]) => {
    sendToPostHog(args, 'log');
  },
  info: (...args: unknown[]) => {
    sendToPostHog(args, 'info');
  },
  warn: (...args: unknown[]) => {
    sendToPostHog(args, 'warn');
  },
  error: (...args: unknown[]) => {
    sendToPostHog(args, 'error');
  },
});
