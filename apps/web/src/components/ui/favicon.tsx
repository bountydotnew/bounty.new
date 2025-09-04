import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface FaviconProps {
  url: string;
  className?: string;
  size?: number;
}

export function Favicon({ url, className, size = 16 }: FaviconProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!url) return null;

  try {
    const domain = new URL(url).hostname;
    const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(
      domain,
    )}&size=${size}`;

    return (
      <>
        {loading && !error && (
          <Loader2 className={cn("animate-spin", className)} size={size} />
        )}
        {!error ? (
          <Image
            src={faviconUrl}
            alt={`${domain} favicon`}
            className={cn("rounded-sm", className)}
            width={size}
            height={size}
            priority
            loading="eager"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
          />
        ) : (
          <div
            className={cn(
              "rounded-sm bg-neutral-800 text-neutral-300 inline-flex items-center justify-center",
              className,
            )}
            style={{ width: size, height: size, fontSize: Math.max(10, size * 0.6) }}
            aria-label={`${domain} favicon fallback`}
          >
            {domain.charAt(0).toUpperCase()}
          </div>
        )}
      </>
    );
  } catch {
    return null;
  }
}
