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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteDropdown } from "@/components/ui/autocomplete";
import {
  RepoResultCard,
  IssueResultCard,
} from "@/components/bounty/github-result-cards";
import { useCurrentUser } from "@/lib/hooks/use-access";
import { MarkdownTextarea } from "@/components/bounty/markdown-editor";

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
  const [body, setBody] = useState("");

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

  const parseGithubInput = (raw: string) => {
    const v = raw.trim();
    const r1 = v.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/i);
    if (r1) return { owner: r1[1], repo: r1[2], number: r1[4] } as const;
    const r2 = v.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/i);
    if (r2) return { owner: r2[1], repo: r2[2] } as const;
    const r3 = v.match(/^([^\/\s]+)\/([^\/\s]+)(?:#(\d+))?$/);
    if (r3) return { owner: r3[1], repo: r3[2], number: r3[3] } as const;
    return null;
  };

  const userRepos = useQuery({
    queryKey: ["repository.userRepos", debouncedUsername],
    queryFn: () =>
      trpcClient.repository.userRepos.query({ username: debouncedUsername }),
    enabled: !!debouncedUsername && open,
    staleTime: 120_000,
    gcTime: 600_000,
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
    staleTime: 60_000,
    gcTime: 600_000,
  });

  

  

  const repoOptions: RepoOption[] = useMemo(() => {
    const result = userRepos.data;
    if (!result || Array.isArray(result) || !('success' in result) || !result.success) {
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

  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
          <DrawerHeader className="px-6 pt-4">
            <DrawerTitle className="text-xl text-white">Import from GitHub</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6 space-y-4 transition-all duration-200">
            <div className="space-y-2 rounded-lg  bg-neutral-900/50 p-3">
              <Label htmlFor="gh-username">Username</Label>
              <Input
                id="gh-username"
                ref={usernameInputRef}
                placeholder="Paste a GitHub URL or enter username"
                value={username}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  const parsed = parseGithubInput(text);
                  if (parsed) {
                    e.preventDefault();
                    if (parsed.owner) setUsername(parsed.owner);
                    if (parsed.repo) setRepoQuery(parsed.repo);
                    if (parsed.number) {
                      setIssueQuery(String(parsed.number));
                      setIssueOpen(false);
                      const url = `https://github.com/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`;
                      trpcClient.repository.issueFromUrl
                        .query({ url })
                        .then((res) => {
                          if (res?.data?.body) setBody(res.data.body);
                        })
                        .catch(() => {});
                      issueInputRef.current?.focus();
                    } else {
                      repoInputRef.current?.focus();
                    }
                  }
                }}
                onChange={(e) => {
                  const v = e.target.value;
                  const parsed = v.includes("github.com") ? parseGithubInput(v) : null;
                  if (parsed) {
                    if (parsed.owner) setUsername(parsed.owner);
                    if (parsed.repo) setRepoQuery(parsed.repo);
                    if (parsed.number) setIssueQuery(String(parsed.number));
                  } else {
                    setUsername(v);
                  }
                }}
              />
            </div>

            <div className="space-y-2 rounded-lg  bg-neutral-900/50 p-3">
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
                        userRepos.data && !Array.isArray(userRepos.data) && 'success' in userRepos.data && userRepos.data.success
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
                  loading={userRepos.isLoading || userRepos.isFetching}
                  skeletonCount={5}
                  onSelect={(r) => {
                    setRepoQuery(r.name);
                    setRepoOpen(false);
                    issueInputRef.current?.focus();
                  }}
                  className="z-20 rounded-md border border-neutral-800 bg-neutral-900/90 backdrop-blur"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg  bg-neutral-900/50 p-3">
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
                  loading={issues.isLoading || issues.isFetching}
                  skeletonCount={6}
                  onSelect={(i) => {
                    setIssueQuery(String(i.number));
                    setIssueOpen(false);
                    const immediateOwner = username.trim();
                    const immediateRepo = repoQuery.trim();
                    const url = `https://github.com/${immediateOwner}/${immediateRepo}/issues/${i.number}`;
                    trpcClient.repository.issueFromUrl
                      .query({ url })
                      .then((res) => {
                        if (res?.data?.body) setBody(res.data.body);
                      })
                      .catch(() => {});
                  }}
                  className="z-20 rounded-md border border-neutral-800 bg-neutral-900/90 backdrop-blur"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gh-body">Body</Label>
              <div className="rounded-lg border border-neutral-800 bg-[#222222] p-3">
                <MarkdownTextarea
                  id="gh-body"
                  value={body}
                  onChange={setBody}
                  placeholder="Edit the issue body before creating a bounty"
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
                  try {
                    if (body && body.length > 0) {
                      window.sessionStorage.setItem(
                        "bounty.importIssueBody",
                        body.slice(0, 1000),
                      );
                    }
                  } catch {}
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
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-lg p-0 sm:rounded-lg border border-neutral-800 bg-neutral-900/90 backdrop-blur">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl text-white">Import from GitHub</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 transition-all duration-200">
          <div className="space-y-2 rounded-lg  bg-neutral-900/50 p-3">
            <Label htmlFor="gh-username">Username</Label>
            <Input
              id="gh-username"
              ref={usernameInputRef}
              placeholder="Paste a GitHub URL or enter username"
              value={username}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                const parsed = parseGithubInput(text);
                if (parsed) {
                  e.preventDefault();
                  if (parsed.owner) setUsername(parsed.owner);
                  if (parsed.repo) setRepoQuery(parsed.repo);
                  if (parsed.number) {
                    setIssueQuery(String(parsed.number));
                    setIssueOpen(false);
                    const url = `https://github.com/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`;
                    trpcClient.repository.issueFromUrl
                      .query({ url })
                      .then((res) => {
                        if (res?.data?.body) setBody(res.data.body);
                      })
                      .catch(() => {});
                    issueInputRef.current?.focus();
                  } else {
                    repoInputRef.current?.focus();
                  }
                }
              }}
              onChange={(e) => {
                const v = e.target.value;
                const parsed = v.includes("github.com") ? parseGithubInput(v) : null;
                if (parsed) {
                  if (parsed.owner) setUsername(parsed.owner);
                  if (parsed.repo) setRepoQuery(parsed.repo);
                  if (parsed.number) setIssueQuery(String(parsed.number));
                } else {
                  setUsername(v);
                }
              }}
            />
          </div>

          <div className="space-y-2 rounded-lg  bg-neutral-900/50 p-3">
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
                      userRepos.data && !Array.isArray(userRepos.data) && 'success' in userRepos.data && userRepos.data.success
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
                loading={userRepos.isLoading || userRepos.isFetching}
                skeletonCount={5}
                onSelect={(r) => {
                  setRepoQuery(r.name);
                  setRepoOpen(false);
                  issueInputRef.current?.focus();
                }}
                className="z-20 rounded-md border border-neutral-800 bg-neutral-900/90 backdrop-blur"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg  bg-neutral-900/50 p-3">
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
                items={(issues.data ?? []) as { number: number; title: string }[]}
                getKey={(i) => i.number}
                renderItem={(i) => (
                  <IssueResultCard number={i.number} title={i.title} />
                )}
                loading={issues.isLoading || issues.isFetching}
                skeletonCount={6}
                onSelect={(i) => {
                  setIssueQuery(String(i.number));
                  setIssueOpen(false);
                  const immediateOwner = username.trim();
                  const immediateRepo = repoQuery.trim();
                  const url = `https://github.com/${immediateOwner}/${immediateRepo}/issues/${i.number}`;
                  trpcClient.repository.issueFromUrl.query({ url }).then((res) => {
                    if (res?.data?.body) setBody(res.data.body);
                  }).catch(() => {});
                }}
                className="z-20 rounded-md border border-neutral-800 bg-neutral-900/90 backdrop-blur"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gh-body">Body</Label>
            <div className="rounded-lg border border-neutral-800 bg-[#222222] p-3">
              <MarkdownTextarea
                id="gh-body"
                value={body}
                onChange={setBody}
                placeholder="Edit the issue body before creating a bounty"
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
                try {
                  if (body && body.length > 0) {
                    window.sessionStorage.setItem(
                      "bounty.importIssueBody",
                      body.slice(0, 1000),
                    );
                  }
                } catch {}
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
