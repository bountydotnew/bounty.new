// Account dropdown types
export interface User {
	name: string;
	email: string;
	image?: string | null;
}

export interface AccountDropdownProps {
	user: User;
	onUpgradeClick?: () => void;
}

export interface UserDisplayData {
	name: string;
	email: string;
	image: string | null;
	initials: string;
}
