import { env } from '@bounty/env/server';
import { withEvlog, log } from '@bounty/logging';
import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_PREFIX_REGEX = /^sha256=/;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MarbleWebhookPayload {
  event: string;
  data?: {
    slug?: string;
    id?: string;
  };
}

function verifyWebhookSignature(
  signature: string,
  body: string,
  secret: string
): boolean {
  const expectedSignature = signature.replace(SIGNATURE_PREFIX_REGEX, '');
  const computedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const computedBuffer = Buffer.from(computedSignature, 'hex');

  return (
    expectedBuffer.length === computedBuffer.length &&
    timingSafeEqual(expectedBuffer, computedBuffer)
  );
}

function handleRevalidation(event: string, data?: MarbleWebhookPayload['data']) {
  if (event.startsWith('post.')) {
    // Revalidate posts list tag
    revalidateTag('posts', 'max');

    // If we have a slug, also revalidate the specific post path
    if (data?.slug) {
      const postPath = `/blog/${data.slug}`;
      revalidatePath(postPath);
      log.info('[Marble Webhook] Revalidated post path', { postPath });
    }

    // Also revalidate the blog listing page
    revalidatePath('/blog');

    if (event === 'post.deleted') {
      log.info('[Marble Webhook] Post deleted, revalidated posts cache');
    } else {
      log.info('[Marble Webhook] Post event, revalidated posts cache', { event });
    }
  } else if (event.startsWith('tag.')) {
    revalidateTag('tags', 'max');
    revalidatePath('/blog');
    log.info('[Marble Webhook] Tag event, revalidated tags cache', { event });
  } else if (event.startsWith('category.')) {
    revalidateTag('categories', 'max');
    revalidatePath('/blog');
    log.info('[Marble Webhook] Category event, revalidated categories cache', { event });
  } else if (event.startsWith('author.')) {
    revalidateTag('authors', 'max');
    revalidatePath('/blog');
    log.info('[Marble Webhook] Author event, revalidated authors cache', { event });
  } else {
    log.warn('[Marble Webhook] Unknown event type', { event });
  }
}

export const POST = withEvlog(async function POST(request: Request) {
  try {
    const webhookSecret = env.MARBLE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      log.error('[Marble Webhook] Missing MARBLE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      );
    }

    const headersList = await headers();
    const signature = headersList.get('x-marble-signature');

    if (!signature) {
      log.error('[Marble Webhook] Missing x-marble-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(signature, body, webhookSecret)) {
      log.error('[Marble Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    let payload: MarbleWebhookPayload;
    try {
      payload = JSON.parse(body) as MarbleWebhookPayload;
    } catch (error) {
      log.error('[Marble Webhook] Invalid JSON payload', { error });
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const { event, data } = payload;

    log.info('[Marble Webhook] Received event', { event });

    // Revalidate cache based on event type
    handleRevalidation(event, data);

    return NextResponse.json({ success: true, revalidated: true });
  } catch (error) {
    log.error('[Marble Webhook] Error processing webhook', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
