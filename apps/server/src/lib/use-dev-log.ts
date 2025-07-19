import { sendErrorWebhook } from './use-discord-webhook';

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
    // Always log to console in production too for server logs
    console.error("[grim::error]", ...args);
  }

  // Send to Discord webhook in production
  if (isProd && process.env.DISCORD_WEBHOOK_URL) {
    try {
      const errorMessage = args.join(' ');
      const location = getCallerLocation();
      
      // Fire and forget - don't await to avoid blocking
      sendErrorWebhook({
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        error: errorMessage,
        location,
        context: {
          timestamp: new Date().toISOString(),
          environment: 'server',
          nodeEnv: process.env.NODE_ENV,
        }
      }).catch((webhookError) => {
        console.error('[grim::error] Failed to send Discord webhook:', webhookError);
      });
    } catch (webhookError) {
      console.error('[grim::error] Discord webhook error:', webhookError);
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