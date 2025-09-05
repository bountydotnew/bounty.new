export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('url');
    if (!target) {
      return new Response('Missing url param', { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(target);
    } catch {
      return new Response('Invalid url', { status: 400 });
    }

    const allowedHosts = new Set([
      'github.com',
      'user-attachments.githubusercontent.com',
      'objects.githubusercontent.com',
    ]);

    if (!allowedHosts.has(url.hostname)) {
      return new Response('Host not allowed', { status: 403 });
    }

    if (
      url.hostname === 'github.com' &&
      !url.pathname.startsWith('/user-attachments/assets/')
    ) {
      return new Response('Path not allowed', { status: 403 });
    }

    const range = req.headers.get('range') || undefined;
    const upstream = await fetch(url.toString(), {
      redirect: 'follow',
      headers: range ? { Range: range } : undefined,
    });

    const headers = new Headers();
    const allowedHeaderNames = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'cache-control',
      'etag',
      'last-modified',
    ];
    for (const name of allowedHeaderNames) {
      const value = upstream.headers.get(name);
      if (value) {
        headers.set(name, value);
      }
    }
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return new Response('Proxy error', { status: 500 });
  }
}
