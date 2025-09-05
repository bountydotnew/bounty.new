import { headers } from 'next/headers';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "INVALID_JSON" }),
      { status: 400 },
    );
  }

  const apiKey = process.env.DATABUDDY_API_KEY as string | undefined;
  const h = await headers();
  const cookie = h.get('cookie') || '';

  const url = new URL(request.url);
  const websiteId = (body.website_id || body.websiteId || url.searchParams.get('website_id') || process.env.DATABUDDY_WEBSITE_ID || process.env.NEXT_PUBLIC_DATABUDDY_WEBSITE_ID || 'bounty') as string;

  const startDate = (body.start_date || body.startDate || url.searchParams.get('start_date') || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) as string;
  const endDate = (body.end_date || body.endDate || url.searchParams.get('end_date') || new Date().toISOString().slice(0, 10)) as string;

  const upstreamUrl = `https://api.databuddy.cc/v1/query?website_id=${encodeURIComponent(websiteId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  const upstreamBody = {
    id: body.id || "custom-query",
    parameters: body.parameters,
    limit: body.limit,
    page: body.page,
    filters: body.filters,
  };

  const res = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : cookie ? { cookie } : {}),
    } as any,
    body: JSON.stringify(upstreamBody),
    cache: "no-store",
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}
