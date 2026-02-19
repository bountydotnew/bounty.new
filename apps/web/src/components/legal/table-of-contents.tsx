"use client";

import { useEffect, useState } from "react";
import { cn } from "@bounty/ui/lib/utils";

interface Section {
	id: string;
	title: string;
}

interface TableOfContentsProps {
	sections: Section[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
	const [activeId, setActiveId] = useState<string>("");

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// Find the first section that is intersecting
				const intersecting = entries.filter((entry) => entry.isIntersecting);
				if (intersecting.length > 0) {
					// Sort by their position in the document and pick the first one
					const sorted = intersecting.sort((a, b) => {
						const aTop = a.boundingClientRect.top;
						const bTop = b.boundingClientRect.top;
						return aTop - bTop;
					});
					setActiveId(sorted[0].target.id);
				}
			},
			{
				rootMargin: "-80px 0px -70% 0px",
				threshold: 0,
			},
		);

		// Observe all sections
		for (const section of sections) {
			const element = document.getElementById(section.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [sections]);

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		e.preventDefault();
		const element = document.getElementById(id);
		if (element) {
			const offset = 100;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});

			// Update URL hash without scrolling
			window.history.pushState(null, "", `#${id}`);
			setActiveId(id);
		}
	};

	return (
		<nav className="space-y-2">
			<p className="mb-4 text-sm font-medium text-foreground">On this page</p>
			{sections.map((section) => (
				<a
					key={section.id}
					href={`#${section.id}`}
					onClick={(e) => handleClick(e, section.id)}
					className={cn(
						"block text-[14px] transition-colors duration-150",
						activeId === section.id
							? "text-foreground font-medium"
							: "text-text-muted hover:text-foreground",
					)}
				>
					{section.title}
				</a>
			))}
		</nav>
	);
}
