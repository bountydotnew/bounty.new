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
    const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain_url=${encodeURIComponent(url)}&size=${size}`;

    return (
      <>
        {loading && (
          <Loader2 className={cn("animate-spin", className)} size={size} />
        )}
        <Image
          src={faviconUrl}
          alt={`${domain} favicon`}
          className={cn("rounded-sm", className)}
          width={size}
          height={size}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          style={{ display: error || loading ? "none" : "block" }}
        />
      </>
    );
  } catch {
    return null;
  }
} 