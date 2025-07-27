import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") {
      setMatches(false);
      return;
    }

    let media: MediaQueryList;
    try {
      media = window.matchMedia(query);
    } catch (error) {
      console.warn(`Invalid media query: ${query}`, error);
      setMatches(false);
      return;
    }
    
    const updateMatches = () => {
      setMatches(media.matches);
    };

    updateMatches();
    media.addEventListener("change", updateMatches);
    
    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return matches ?? false;
} 