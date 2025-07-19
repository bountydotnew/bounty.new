const sendToDiscord = async (message: string, type: 'log' | 'warn' | 'info' | 'error', location: string) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    
    if (type === 'error') {
      // Use reportError endpoint for errors
      fetch(`${baseUrl}/api/trpc/notifications.reportError`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            error: message,
            location,
            userAgent: 'Server/Node.js',
            url: 'server-side',
          }
        }),
      }).catch((fetchError) => {
        console.error('[grim::discord] Failed to report error:', fetchError);
      });
    } else {
      // Use sendWebhook endpoint for other log types
      const typeMap = {
        log: 'info',
        warn: 'warning', 
        info: 'info',
      };

      fetch(`${baseUrl}/api/trpc/notifications.sendWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            message,
            title: `🔍 Server ${type.toUpperCase()}`,
            type: typeMap[type as keyof typeof typeMap],
            context: {
              location,
              timestamp: new Date().toISOString(),
              environment: 'server',
              nodeEnv: process.env.NODE_ENV,
            },
          }
        }),
      }).catch((fetchError) => {
        console.error('[grim::discord] Failed to send webhook:', fetchError);
      });
    }
  } catch (reportError) {
    console.error('[grim::discord] Discord reporting failed:', reportError);
  }
};

const log = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  const message = args.join(' ');
  
  if (isDev) {
    console.log("%c[grim::log]", "color: #7a7a7a; font-weight: bold;", ...args);
  } else {
    console.log("[grim::log]", ...args);
    // Send to Discord in production
    const location = getCallerLocation();
    sendToDiscord(message, 'log', location);
  }
};

const error = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  const message = args.join(' ');
  
  if (isDev) {
    console.error("%c[grim::error]", "color: #ef4444; font-weight: bold;", ...args);
  } else {
    console.error("[grim::error]", ...args);
    // Send to Discord in production
    const location = getCallerLocation();
    sendToDiscord(message, 'error', location);
  }
};

const warn = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  const message = args.join(' ');
  
  if (isDev) {
    console.warn("%c[grim::warn]", "color: #f59e0b; font-weight: bold;", ...args);
  } else {
    console.warn("[grim::warn]", ...args);
    // Send to Discord in production
    const location = getCallerLocation();
    sendToDiscord(message, 'warn', location);
  }
};

const info = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  const message = args.join(' ');
  
  if (isDev) {
    console.info("%c[grim::info]", "color: #10b981; font-weight: bold;", ...args);
  } else {
    console.info("[grim::info]", ...args);
    // Send to Discord in production
    const location = getCallerLocation();
    sendToDiscord(message, 'info', location);
  }
};

// Helper function to get caller location
function getCallerLocation(): string {
  try {
    const err = new Error();
    const stack = err.stack;
    if (!stack) return 'Unknown';
    
    const lines = stack.split('\n');
    // Skip Error constructor, getCallerLocation, and error function calls
    const callerLine = lines[4] || lines[3] || 'Unknown';
    
    // Extract just the file and line info
    const match = callerLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, funcName, file, line] = match;
      const fileName = file.split('/').pop() || file;
      return `${fileName}:${line} (${funcName})`;
    }
    
    return callerLine.trim();
  } catch {
    return 'Unknown';
  }
}

export const grim = () => {
  return { log, error, warn, info }; 
};