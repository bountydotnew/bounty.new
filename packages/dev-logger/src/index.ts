// Send errors to PostHog if available
const sendToPostHog = (message: string, type: string) => {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    const posthog = (window as any).posthog;
    
    if (type === 'error') {
      posthog.captureException(new Error(message));
    } else {
      posthog.capture('grim_log', {
        level: type,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }
};

export const grim = () => ({
  log: (...args: unknown[]) => {
    console.log('%c[grim::log]', 'color: white', ...args);
    sendToPostHog(args, 'log');
  },
  info: (...args: unknown[]) => {
    console.info('%c[grim::info]', 'color: grey', ...args);
    sendToPostHog(args, 'info');
  },
  warn: (...args: unknown[]) => {
    console.warn('%c[grim::warn]', 'color: yellow', ...args);
    sendToPostHog(args, 'warn');
  },
  error: (...args: unknown[]) => {
    console.error('%c[grim::error]', 'color: red', ...args);
    sendToPostHog(args, 'error');
  },
}); 