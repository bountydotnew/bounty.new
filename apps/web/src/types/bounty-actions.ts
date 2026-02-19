import type { ReactNode } from "react";

export interface ActionItem {
	key: string;
	label: string;
	onSelect: () => void;
	icon?: ReactNode;
	disabled?: boolean;
	className?: string;
	tooltip?: string;
}
