"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	MoreHorizontalIcon,
} from "lucide-react";
import * as React from "react";

import { cn } from "@bounty/ui/lib/utils";
import { type Button, buttonVariants } from "@bounty/ui/components/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			data-slot="pagination"
			{...props}
		/>
	);
}

function PaginationContent({
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn("flex flex-row items-center gap-1", className)}
			data-slot="pagination-content"
			{...props}
		/>
	);
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
	return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
	isActive?: boolean;
	size?: React.ComponentProps<typeof Button>["size"];
	asChild?: boolean;
} & useRender.ComponentProps<"a">;

function PaginationLink({
	className,
	isActive,
	size = "icon",
	render,
	asChild,
	children,
	...props
}: PaginationLinkProps) {
	// asChild support: convert first child element to render prop
	let finalRender = render;
	let finalChildren = children;

	if (asChild && !render && React.isValidElement(children)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const childElement = children as React.ReactElement<any>;
		finalRender = React.cloneElement(childElement, { children: undefined });
		finalChildren = childElement.props.children;
	}

	const defaultProps = {
		"aria-current": isActive ? ("page" as const) : undefined,
		className: finalRender
			? className
			: cn(
					buttonVariants({
						size,
						variant: isActive ? "outline" : "ghost",
					}),
					className,
				),
		"data-active": isActive,
		"data-slot": "pagination-link",
		children: finalChildren,
	};

	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(defaultProps, props),
		render: finalRender,
	});
}

function PaginationPrevious({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to previous page"
			className={cn("max-sm:aspect-square max-sm:p-0", className)}
			size="default"
			{...props}
		>
			<ChevronLeftIcon className="sm:-ms-1" />
			<span className="max-sm:hidden">Previous</span>
		</PaginationLink>
	);
}

function PaginationNext({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to next page"
			className={cn("max-sm:aspect-square max-sm:p-0", className)}
			size="default"
			{...props}
		>
			<span className="max-sm:hidden">Next</span>
			<ChevronRightIcon className="sm:-me-1" />
		</PaginationLink>
	);
}

function PaginationEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden
			className={cn("flex min-w-7 justify-center", className)}
			data-slot="pagination-ellipsis"
			{...props}
		>
			<MoreHorizontalIcon className="size-5 sm:size-4" />
			<span className="sr-only">More pages</span>
		</span>
	);
}

export {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
};
