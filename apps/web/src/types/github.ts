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
