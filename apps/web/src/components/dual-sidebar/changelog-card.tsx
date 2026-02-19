"use client";

import { useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { Button } from "@bounty/ui/components/button";

// Changelog config - update this when new releases go out
const changelogConfig = {
	date: "February 2026",
	label: "Feb 2026",
	title: "Organization settings, unified sidebar refactor, and more.",
	url: "https://docs.bounty.new/changelog",
};

const STORAGE_KEY = "changelog-card-dismissed";

export const ChangelogCard = () => {
	const [isDismissed, setIsDismissed] = useState(() => {
		if (typeof window !== "undefined") {
			return !!localStorage.getItem(STORAGE_KEY);
		}
		return false;
	});

	const handleDismiss = () => {
		setIsDismissed(true);
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, "true");
		}
	};

	if (isDismissed) {
		return null;
	}

	return (
		<div className="group/sheet relative flex flex-col gap-2 rounded-[8px] border border-border-subtle bg-surface-1 p-3">
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<p className="text-[10px] text-text-tertiary uppercase tracking-wider">
						Changelog • {changelogConfig.label}
					</p>
					<p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
						{changelogConfig.title}
					</p>
				</div>
				<button
					type="button"
					onClick={handleDismiss}
					className="shrink-0 text-text-tertiary hover:text-foreground transition-colors p-0.5 rounded hover:bg-surface-hover"
				>
					<X className="h-3 w-3" />
				</button>
			</div>

			{/* Read more button */}
			<Button
				variant="ghost"
				size="sm"
				asChild
				className="h-7 px-2 text-xs text-text-secondary hover:text-foreground justify-start"
			>
				<a
					href={changelogConfig.url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1"
				>
					Read more
					<ArrowUpRight className="h-3 w-3" />
				</a>
			</Button>
		</div>
	);
};
