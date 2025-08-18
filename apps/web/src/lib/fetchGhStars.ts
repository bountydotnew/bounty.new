import { useQuery } from "@tanstack/react-query";

export function useGithubStars(repo: string) {
  return useQuery({
    queryKey: ["githubStars", repo],
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${repo}`);
      if (!res.ok) {
        throw new Error(`Github API error: ${res.status}`);
      }
      const data = await res.json();
      return data.stargazers_count;
    },
    staleTime: 60 * 1000,
  });
}
