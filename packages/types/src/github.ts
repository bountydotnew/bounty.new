export interface GitHubRepository {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	private: boolean;
	description: string | null;
	html_url: string;
	clone_url: string;
	ssh_url: string;
	url: string;
	homepage: string | null;
	language: string | null;
	stargazers_count: number;
	watchers_count: number;
	forks_count: number;
	size: number;
	open_issues_count: number;
	fork: boolean;
	has_issues: boolean;
	has_projects: boolean;
	has_wiki: boolean;
	has_pages: boolean;
	has_downloads: boolean;
	visibility: "public" | "private" | "internal";
	archived: boolean;
	disabled: boolean;
	default_branch: string;
	topics?: string[];
	created_at: string;
	updated_at: string;
	pushed_at: string;
	permissions?: {
		admin: boolean;
		push: boolean;
		pull: boolean;
	};
}

export interface GitHubUser {
	login: string;
	id: number;
	avatar_url: string;
	html_url: string;
	type: "User" | "Organization" | "Bot";
}

export interface GitHubLabel {
	name: string;
	color: string;
	description?: string;
}

export interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	html_url: string;
	state: "open" | "closed";
	locked: boolean;
	active_lock_reason?: string;
	labels: (string | GitHubLabel)[];
	assignee: GitHubUser | null;
	assignees: GitHubUser[];
	user: GitHubUser;
	comments: number;
	milestone?: {
		id: number;
		title: string;
		description: string | null;
		state: "open" | "closed";
	};
	pull_request?: {
		html_url: string;
		diff_url: string;
		patch_url: string;
	};
	created_at: string;
	updated_at: string;
	closed_at: string | null;
}

export interface ProcessedGitHubRepository {
	id: number;
	name: string;
	full_name: string;
	description?: string;
	html_url: string;
	language?: string;
	stars: number;
	forks: number;
	open_issues: number;
	topics: string[];
}

export interface ProcessedGitHubIssue {
	id: number;
	number: number;
	title: string;
	body?: string;
	html_url: string;
	state: "open" | "closed";
	labels: string[];
	assignees: string[];
	author: string;
	created_at: string;
	updated_at: string;
}
