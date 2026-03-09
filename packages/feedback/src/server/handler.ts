import {
  Chat,
  Card,
  CardText,
  Fields,
  Field,
  type Adapter,
  type StateAdapter,
} from 'chat';
import { createMemoryState } from '@chat-adapter/state-memory';

export interface FeedbackHandlerConfig {
  adapters: Record<string, Adapter>;
  channels: string[];
  state?: StateAdapter;
  botName?: string;
  formatTitle?: (data: FeedbackData) => string;
  formatBody?: (data: FeedbackData) => string;
  onFeedback?: (data: FeedbackData) => void | Promise<void>;
}

export interface ElementContext {
  componentName: string | null;
  selector: string | null;
  htmlPreview?: string;
  stack: Array<{
    functionName: string | null;
    fileName: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  }>;
}

export interface FeedbackData {
  comment: string;
  route: string;
  userAgent: string;
  prompt?: string;
  element?: ElementContext | null;
  metadata?: Record<string, string>;
  hasScreenshot: boolean;
  screenshot?: File | null;
}

export function createFeedbackHandler(config: FeedbackHandlerConfig) {
  // Scope chatInstance per handler factory instead of module-global
  let chatInstance: Chat | null = null;

  function getChat(): Chat {
    if (!chatInstance) {
      chatInstance = new Chat({
        userName: config.botName ?? 'feedback-bot',
        adapters: config.adapters,
        state: config.state ?? createMemoryState(),
      });
    }
    return chatInstance;
  }

  return async function POST(request: Request): Promise<Response> {
    try {
      const formData = await request.formData();

      // Validate formData field types before using them
      const rawComment = formData.get('comment');
      const rawRoute = formData.get('route');
      const rawUserAgent = formData.get('userAgent');
      const rawPrompt = formData.get('prompt');
      const rawElement = formData.get('element');
      const rawMetadata = formData.get('metadata');
      const rawScreenshot = formData.get('screenshot');

      const comment = typeof rawComment === 'string' ? rawComment : '';
      const route = typeof rawRoute === 'string' ? rawRoute : '';
      const userAgent = typeof rawUserAgent === 'string' ? rawUserAgent : '';
      const prompt =
        typeof rawPrompt === 'string' && rawPrompt ? rawPrompt : undefined;
      const elementStr = typeof rawElement === 'string' ? rawElement : null;
      const metadataStr = typeof rawMetadata === 'string' ? rawMetadata : null;
      const screenshot = rawScreenshot instanceof File ? rawScreenshot : null;

      let metadata: Record<string, string> = {};
      if (metadataStr) {
        try {
          const parsed: unknown = JSON.parse(metadataStr);
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            return new Response(
              JSON.stringify({ error: 'metadata must be a JSON object' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          for (const [key, value] of Object.entries(parsed)) {
            if (typeof value !== 'string') {
              return new Response(
                JSON.stringify({
                  error: `metadata value for "${key}" must be a string`,
                }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          }
          metadata = parsed as Record<string, string>;
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid metadata JSON' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      let element: ElementContext | null = null;
      if (elementStr) {
        try {
          const parsed: unknown = JSON.parse(elementStr);
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            return new Response(
              JSON.stringify({ error: 'element must be a JSON object' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          const obj = parsed as Record<string, unknown>;
          if (!Array.isArray(obj.stack)) {
            return new Response(
              JSON.stringify({ error: 'element.stack must be an array' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          for (const item of obj.stack) {
            if (typeof item !== 'object' || item === null) {
              return new Response(
                JSON.stringify({
                  error: 'element.stack items must be objects',
                }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          }
          element = parsed as ElementContext;
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid element JSON' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      const feedbackData: FeedbackData = {
        comment,
        route,
        userAgent,
        prompt,
        element,
        metadata,
        hasScreenshot: !!screenshot,
        screenshot,
      };

      await config.onFeedback?.(feedbackData);

      // Short-circuit when no channels are configured
      if (config.channels.length === 0) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const chat = getChat();

      const title = config.formatTitle?.(feedbackData) ?? 'New Feedback';
      const body = config.formatBody?.(feedbackData) ?? comment;

      const fieldEntries = [
        Field({ label: 'Page', value: route || 'Unknown' }),
      ];

      if (Object.keys(metadata).length > 0) {
        for (const [key, value] of Object.entries(metadata)) {
          fieldEntries.push(Field({ label: key, value }));
        }
      }

      if (feedbackData.hasScreenshot) {
        fieldEntries.push(Field({ label: 'Screenshot', value: 'Attached' }));
      }

      const card = Card({
        title,
        children: [CardText(body), Fields(fieldEntries)],
      });

      const postPromises = config.channels.map(async (channelId) => {
        try {
          const channel = chat.channel(channelId);

          if (screenshot) {
            const arrayBuffer = await screenshot.arrayBuffer();
            await channel.post({
              card,
              files: [
                {
                  data: Buffer.from(arrayBuffer),
                  filename: 'screenshot.png',
                },
              ],
            });
          } else {
            await channel.post(card);
          }
        } catch (err) {
          console.error(`[feedback] Failed to post to ${channelId}:`, err);
        }
      });

      await Promise.allSettled(postPromises);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[feedback] Error processing feedback:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process feedback' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
