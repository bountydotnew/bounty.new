export interface RepoOption {
  name: string;
  full_name: string;
  private: boolean;
}

export interface UserProfile {
  githubUsername?: string;
}

export interface CurrentUserData {
  profile?: UserProfile;
}

export interface CurrentUser {
  data?: CurrentUserData;
}

export interface GithubParseResult {
  owner: string;
  repo: string;
  number?: string;
}

export interface GithubImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string;
}

interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  html_url: string;
  user?: {
    login: string;
    avatar_url: string;
  };
  labels?: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
}
