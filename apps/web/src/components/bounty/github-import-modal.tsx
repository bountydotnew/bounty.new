"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteDropdown } from "@/components/ui/autocomplete";
import {
  RepoResultCard,
  IssueResultCard,
} from "@/components/bounty/github-result-cards";
import { useCurrentUser } from "@/lib/hooks/use-access";

type RepoOption = { name: string; full_name: string; private: boolean };

export default function GithubImportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const defaultUsername =
    (currentUser as { data?: { profile?: { githubUsername?: string } } })?.data
      ?.profile?.githubUsername || "";
  const [username, setUsername] = useState<string>(defaultUsername);
  const [repoQuery, setRepoQuery] = useState("");
  const [issueQuery, setIssueQuery] = useState("");
  const [repoOpen, setRepoOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(
    null as unknown as HTMLInputElement,
  );
  const repoInputRef = useRef<HTMLInputElement>(
    null as unknown as HTMLInputElement,
  );
  const issueInputRef = useRef<HTMLInputElement>(
    null as unknown as HTMLInputElement,
  );

  const debouncedUsername = useDebouncedValue(username, 300);
  const debouncedRepoQuery = useDebouncedValue(repoQuery, 300);
  const debouncedIssueQuery = useDebouncedValue(issueQuery, 300);

  const userRepos = useQuery({
    queryKey: ["repository.userRepos", debouncedUsername],
    queryFn: () =>
      trpcClient.repository.userRepos.query({ username: debouncedUsername }),
    enabled: !!debouncedUsername && open,
  });

  useEffect(() => {
    const next = (
      currentUser as { data?: { profile?: { githubUsername?: string } } }
    )?.data?.profile?.githubUsername;
    if (next && !username) setUsername(next);
  }, [currentUser, username]);

  const owner = debouncedUsername.trim();
  const repo = debouncedRepoQuery.trim();
  const issues = useQuery({
    queryKey: ["repository.searchIssues", owner, repo, debouncedIssueQuery],
    queryFn: () =>
      trpcClient.repository.searchIssues.query({
        owner,
        repo,
        q: debouncedIssueQuery,
      }),
    enabled: !!owner && !!repo && open && debouncedIssueQuery.length > 0,
  });

  const repoOptions: RepoOption[] = useMemo(() => {
    const result = userRepos.data;
    if (!result || !result.success) {
      return [];
    }
    const repos =
      result.data as (import("@bounty/api/driver/github").UserRepo & {
        stargazersCount?: number;
      })[];
    const ownerName = username.trim();
    return repos.map((r) => ({
      name: r.name,
      full_name: ownerName ? `${ownerName}/${r.name}` : r.name,
      private: Boolean(r.private),
    }));
  }, [userRepos.data, username]);

  const canSubmit =
    owner.length > 0 && repo.length > 0 && issueQuery.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-lg p-0 sm:rounded-lg">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Import from GitHub</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gh-username">Username</Label>
            <Input
              id="gh-username"
              ref={usernameInputRef}
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gh-repo">Repository</Label>
            <div className="relative">
              <Input
                id="gh-repo"
                placeholder="hello-world"
                ref={repoInputRef}
                value={repoQuery}
                onFocus={() => setRepoOpen(true)}
                onBlur={() => setTimeout(() => setRepoOpen(false), 100)}
                onChange={(e) => {
                  setRepoQuery(e.target.value);
                  setRepoOpen(true);
                }}
              />
              <AutocompleteDropdown
                open={repoOpen}
                items={repoOptions.filter((r) =>
                  r.name.toLowerCase().includes(repoQuery.toLowerCase()),
                )}
                getKey={(r) => r.full_name}
                renderItem={(r) => (
                  <RepoResultCard
                    name={r.name}
                    fullName={r.full_name}
                    private={r.private}
                    stars={
                      userRepos.data?.success
                        ? (
                            userRepos.data.data as {
                              name: string;
                              stargazersCount?: number;
                            }[]
                          )?.find?.((x) => x.name === r.name)?.stargazersCount
                        : undefined
                    }
                  />
                )}
                onSelect={(r) => {
                  setRepoQuery(r.name);
                  setRepoOpen(false);
                  issueInputRef.current?.focus();
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gh-issue">Issue</Label>
            <div className="relative">
              <Input
                id="gh-issue"
                placeholder="123 or search text"
                ref={issueInputRef}
                value={issueQuery}
                onFocus={() => setIssueOpen(true)}
                onBlur={() => setTimeout(() => setIssueOpen(false), 100)}
                onChange={(e) => {
                  setIssueQuery(e.target.value);
                  setIssueOpen(true);
                }}
              />
              <AutocompleteDropdown
                open={issueOpen}
                items={
                  (issues.data ?? []) as { number: number; title: string }[]
                }
                getKey={(i) => i.number}
                renderItem={(i) => (
                  <IssueResultCard number={i.number} title={i.title} />
                )}
                onSelect={(i) => {
                  setIssueQuery(String(i.number));
                  setIssueOpen(false);
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                const immediateOwner = username.trim();
                const immediateRepo = repoQuery.trim();
                router.push(
                  `/${immediateOwner}/${immediateRepo}/issues/${issueQuery}`,
                );
                onOpenChange(false);
              }}
            >
              Go
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}
