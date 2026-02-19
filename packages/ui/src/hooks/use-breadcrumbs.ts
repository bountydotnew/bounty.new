"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface BreadcrumbItem {
	label: string;
	href: string;
	isActive: boolean;
}

export interface UseBreadcrumbsOptions {
	customLabels?: Record<string, string>;
	excludePaths?: string[];
	homeLabel?: string;
}

export function useBreadcrumbs({
	customLabels = {},
	excludePaths = [],
	homeLabel = "Home",
}: UseBreadcrumbsOptions = {}) {
	const pathname = usePathname();

	const breadcrumbs = useMemo(() => {
		const segments = pathname.split("/").filter(Boolean);
		const items: BreadcrumbItem[] = [];

		// Add home if not excluded
		if (!excludePaths.includes("/")) {
			items.push({
				label: homeLabel,
				href: "/",
				isActive: pathname === "/",
			});
		}

		// Build breadcrumbs from path segments
		segments.forEach((segment, index) => {
			const href = `/${segments.slice(0, index + 1).join("/")}`;

			// Skip if path is excluded
			if (excludePaths.includes(href)) {
				return;
			}

			// Format label
			let label = decodeURIComponent(segment)
				.replace(/-/g, " ")
				.replace(/_/g, " ")
				.replace(/\b\w/g, (char) => char.toUpperCase());

			// Use custom label if provided
			if (customLabels[segment] || customLabels[href]) {
				label = customLabels[segment] || customLabels[href] || "";
			}

			items.push({
				label,
				href,
				isActive: pathname === href,
			});
		});

		return items;
	}, [pathname, customLabels, excludePaths, homeLabel]);

	return {
		breadcrumbs,
		currentPage: breadcrumbs.at(-1),
		isHomePage: pathname === "/",
	};
}
