// Dashboard related types
export interface Bounty {
	id: string;
	title: string;
	description: string;
	amount: number;
	currency: string;
	status: "draft" | "open" | "in_progress" | "completed" | "cancelled";
	deadline?: string | null;
	tags?: string[] | null;
	repositoryUrl?: string | null;
	issueUrl?: string | null;
	createdAt: string;
	updatedAt: string;
	creator: {
		id: string;
		name: string | null;
		image: string | null;
	};
	votes?: number;
	isFeatured?: boolean;
	paymentStatus?:
		| "pending"
		| "held"
		| "released"
		| "refunded"
		| "failed"
		| null;
	// Linear integration fields
	linearIssueId?: string | null;
	linearIssueIdentifier?: string | null; // e.g., "ENG-123"
	linearIssueUrl?: string | null;
}

interface UserData {
	id: string;
	name: string | null;
	handle: string | null;
	isProfilePrivate: boolean;
}

interface DashboardQueries {
	bounties: {
		data?: { data: Bounty[] };
		isLoading: boolean;
		isError: boolean;
		error?: Error | null;
	};
	myBounties: {
		data?: { data: Bounty[] };
		isLoading: boolean;
		refetch: () => void;
	};
	userData: {
		data?: UserData;
	};
}
