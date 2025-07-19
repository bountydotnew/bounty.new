const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log("%c[grim::log]", "color: #7a7a7a; font-weight: bold;", ...args);
  }
};

const error = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isDev) {
    console.error("%c[grim::error]", "color: #ef4444; font-weight: bold;", ...args);
  } else {
    // Always log to console in production too
    console.error("[grim::error]", ...args);
  }

  // Send to Discord via tRPC in production
  if (isProd && typeof window !== 'undefined') {
    try {
      const errorMessage = args.join(' ');
      const location = getCallerLocation();
      
      // Send via fetch to avoid circular dependencies with tRPC
      fetch('/api/trpc/notifications.reportError', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            error: errorMessage,
            location,
            userAgent: navigator.userAgent,
            url: window.location.href,
          }
        }),
      }).catch((fetchError) => {
        console.error('[grim::error] Failed to report error:', fetchError);
      });
    } catch (reportError) {
      console.error('[grim::error] Error reporting failed:', reportError);
    }
  }
};

const warn = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.warn("%c[grim::warn]", "color: #f59e0b; font-weight: bold;", ...args);
  } else {
    console.warn("[grim::warn]", ...args);
  }
};

const info = (...args: unknown[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.info("%c[grim::info]", "color: #10b981; font-weight: bold;", ...args);
  } else {
    console.info("[grim::info]", ...args);
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
    
    // Extract just the file and line info for client-side
    const match = callerLine.match(/at (.+) \((.+):(\d+):(\d+)\)/) || 
                   callerLine.match(/at (.+):(\d+):(\d+)/);
    if (match && match.length >= 3) {
      const file = match[match.length - 3] || 'Unknown';
      const line = match[match.length - 2] || 'Unknown';
      const fileName = file.split('/').pop() || file;
      return `${fileName}:${line}`;
    }
    
    return callerLine.trim();
  } catch {
    return 'Unknown';
  }
}

export const grim = () => {
  return { log, error, warn, info }; 
};