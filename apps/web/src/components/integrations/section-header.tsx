interface SectionHeaderProps {
	title: string;
	count?: number;
	badge?: {
		label: string;
		variant?: "default" | "success" | "warning" | "error";
	};
}

const badgeStyles = {
	default: "bg-surface-3 text-text-muted",
	success: "bg-green-500/10 text-green-400",
	warning: "bg-yellow-500/10 text-yellow-400",
	error: "bg-red-500/10 text-red-400",
};

export function SectionHeader({ title, count, badge }: SectionHeaderProps) {
	return (
		<div className="flex items-center gap-2 mb-4">
			<h2 className="text-base">{title}</h2>
			{count !== undefined && (
				<span className="px-2 py-0.5 rounded-md bg-surface-3 text-xs text-text-muted">
					{count}
				</span>
			)}
			{badge && (
				<span
					className={`px-2 py-0.5 rounded-md text-xs ${badgeStyles[badge.variant || "default"]}`}
				>
					{badge.label}
				</span>
			)}
		</div>
	);
}
