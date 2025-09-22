import { cn } from '@bounty/ui/lib/utils';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface FaviconProps {
  url: string;
  className?: string;
  size?: number;
}

export function Favicon({ url, className, size = 16 }: FaviconProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!url) {
    return null;
  }

  try {
    const domain = new URL(url).hostname;
    const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(
      domain
    )}&size=${size}`;

    return (
      <>
        {loading && !error && (
          <Loader2 className={cn('animate-spin', className)} size={size} />
        )}
        {error ? (
          <div
            aria-label={`${domain} favicon fallback`}
            className={cn(
              'inline-flex items-center justify-center rounded-sm bg-neutral-800 text-neutral-300',
              className
            )}
            style={{
              width: size,
              height: size,
              fontSize: Math.max(10, size * 0.6),
            }}
          >
            {domain.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Image
            alt={`${domain} favicon`}
            className={cn('rounded-sm', className)}
            height={size}
            loading="eager"
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            onLoad={() => setLoading(false)}
            priority
            src={faviconUrl}
            width={size}
          />
        )}
      </>
    );
  } catch {
    return null;
  }
}
