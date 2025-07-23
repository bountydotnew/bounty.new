// Send errors to PostHog if available
const sendToPostHog = (message, type) => {
    if (typeof window !== 'undefined' && window.posthog) {
        const posthog = window.posthog;
        if (type === 'error') {
            posthog.captureException(new Error(message));
        }
        else {
            posthog.capture('grim_log', {
                level: type,
                message,
                timestamp: new Date().toISOString(),
            });
        }
    }
};
export const grim = () => ({
    log: (...args) => {
        console.log('%c[grim::log]', 'color: white', ...args);
        sendToPostHog(args.join(' '), 'log');
    },
    info: (...args) => {
        console.info('%c[grim::info]', 'color: grey', ...args);
        sendToPostHog(args.join(' '), 'info');
    },
    warn: (...args) => {
        console.warn('%c[grim::warn]', 'color: yellow', ...args);
        sendToPostHog(args.join(' '), 'warn');
    },
    error: (...args) => {
        console.error('%c[grim::error]', 'color: red', ...args);
        sendToPostHog(args.join(' '), 'error');
    },
});
//# sourceMappingURL=index.js.map