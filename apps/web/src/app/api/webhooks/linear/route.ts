import { after } from 'next/server';
import {
  getLinearWebhookHandler,
  setLastWebhookOrganizationId,
} from '@bounty/api/src/lib/bot';

export async function POST(request: Request) {
  try {
    // The adapter doesn't pass organizationId through to raw messages (hardcoded
    // to undefined). We extract it from the payload here and stash it so the
    // mention handler can read it.
    const body = await request.text();

    try {
      const payload = JSON.parse(body) as { organizationId?: string };
      if (payload.organizationId) {
        setLastWebhookOrganizationId(payload.organizationId);
      }
    } catch {
      // If JSON parsing fails, the adapter will handle the error
    }

    // Reconstruct the request since we consumed the body
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });

    const handler = getLinearWebhookHandler();
    return await handler(newRequest, {
      waitUntil: (task) => after(() => task),
    });
  } catch (error) {
    console.error('[Linear Webhook] Handler error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
