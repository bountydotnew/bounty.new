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

let chatInstance: Chat | null = null;

function getChat(config: FeedbackHandlerConfig): Chat {
  if (!chatInstance) {
    chatInstance = new Chat({
      userName: config.botName ?? 'feedback-bot',
      adapters: config.adapters,
      state: config.state ?? createMemoryState(),
    });
  }
  return chatInstance;
}

export function createFeedbackHandler(config: FeedbackHandlerConfig) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const formData = await request.formData();
      const comment = (formData.get('comment') as string) ?? '';
      const route = (formData.get('route') as string) ?? '';
      const userAgent = (formData.get('userAgent') as string) ?? '';
      const prompt = (formData.get('prompt') as string) || undefined;
      const elementStr = formData.get('element') as string | null;
      const metadataStr = formData.get('metadata') as string | null;
      const screenshot = formData.get('screenshot') as File | null;

      const metadata: Record<string, string> = metadataStr
        ? JSON.parse(metadataStr)
        : {};

      const element: ElementContext | null = elementStr
        ? JSON.parse(elementStr)
        : null;

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

      const chat = getChat(config);

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
          console.error(
            `[feedback] Failed to post to ${channelId}:`,
            err
          );
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
