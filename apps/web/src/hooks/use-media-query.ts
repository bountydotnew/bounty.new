import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    
    const updateMatches = () => {
      setMatches(media.matches);
    };

    updateMatches();
    media.addEventListener("change", updateMatches);
    
    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
} 