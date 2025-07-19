import { sendErrorWebhook, sendInfoWebhook } from './use-discord-webhook';

const sendToDiscord = async (message: string, type: string) => {
  if (process.env.NODE_ENV !== 'production') return;
  
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  if (type === 'error') {
    await sendErrorWebhook({ webhookUrl, error: message, location: 'server' });
  } else {
    const colorMap = { log: 0xffffff, info: 0x808080, warn: 0xffff00, error: 0xff0000 };
    await sendInfoWebhook({
      webhookUrl,
      title: `🔍 Server ${type.toUpperCase()}`,
      message,
      color: colorMap[type as keyof typeof colorMap] || 0x808080,
    });
  }
};

export const grim = () => ({
  log: (...args: unknown[]) => {
    console.log('[grim::log]', ...args);
    sendToDiscord(args.join(' '), 'log');
  },
  info: (...args: unknown[]) => {
    console.info('[grim::info]', ...args);
    sendToDiscord(args.join(' '), 'info');
  },
  warn: (...args: unknown[]) => {
    console.warn('[grim::warn]', ...args);
    sendToDiscord(args.join(' '), 'warn');
  },
  error: (...args: unknown[]) => {
    console.error('[grim::error]', ...args);
    sendToDiscord(args.join(' '), 'error');
  },
});