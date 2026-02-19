"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@bounty/ui/lib/utils";
import { Input } from "@bounty/ui/components/input";
import { ScrollArea } from "@bounty/ui/components/scroll-area";

const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteInput({
	className,
	showTrigger = false,
	showClear = false,
	startAddon,
	size,
	...props
}: Omit<AutocompletePrimitive.Input.Props, "size"> & {
	showTrigger?: boolean;
	showClear?: boolean;
	startAddon?: React.ReactNode;
	size?: "sm" | "default" | "lg" | number;
	ref?: React.Ref<HTMLInputElement>;
}) {
	const sizeValue = (size ?? "default") as "sm" | "default" | "lg" | number;

	return (
		<div className="relative not-has-[>*.w-full]:w-fit w-full text-foreground has-disabled:opacity-64">
			{startAddon && (
				<div
					aria-hidden="true"
					className="[&_svg]:-mx-0.5 pointer-events-none absolute inset-y-0 start-px z-10 flex items-center ps-[calc(--spacing(3)-1px)] opacity-80 has-[+[data-size=sm]]:ps-[calc(--spacing(2.5)-1px)] [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4"
					data-slot="autocomplete-start-addon"
				>
					{startAddon}
				</div>
			)}
			<AutocompletePrimitive.Input
				className={cn(
					startAddon &&
						"data-[size=sm]:*:data-[slot=autocomplete-input]:ps-[calc(--spacing(7.5)-1px)] *:data-[slot=autocomplete-input]:ps-[calc(--spacing(8.5)-1px)] sm:data-[size=sm]:*:data-[slot=autocomplete-input]:ps-[calc(--spacing(7)-1px)] sm:*:data-[slot=autocomplete-input]:ps-[calc(--spacing(8)-1px)]",
					sizeValue === "sm"
						? "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-6.5"
						: "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-7",
					className,
				)}
				data-slot="autocomplete-input"
				render={<Input nativeInput size={sizeValue} />}
				{...props}
			/>
			{showTrigger && (
				<AutocompleteTrigger
					className={cn(
						"-translate-y-1/2 absolute top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent opacity-80 outline-none transition-colors pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 has-[+[data-slot=autocomplete-clear]]:hidden sm:size-7 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
						sizeValue === "sm" ? "end-0" : "end-0.5",
					)}
				>
					<ChevronsUpDownIcon />
				</AutocompleteTrigger>
			)}
			{showClear && (
				<AutocompleteClear
					className={cn(
						"-translate-y-1/2 absolute top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent opacity-80 outline-none transition-colors pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 has-[+[data-slot=autocomplete-clear]]:hidden sm:size-7 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
						sizeValue === "sm" ? "end-0" : "end-0.5",
					)}
				>
					<XIcon />
				</AutocompleteClear>
			)}
		</div>
	);
}

function AutocompletePopup({
	className,
	children,
	sideOffset = 4,
	...props
}: AutocompletePrimitive.Popup.Props & {
	sideOffset?: number;
}) {
	return (
		<AutocompletePrimitive.Portal>
			<AutocompletePrimitive.Positioner
				className="z-50 select-none"
				data-slot="autocomplete-positioner"
				sideOffset={sideOffset}
			>
				<span
					className={cn(
						"relative flex max-h-full origin-(--transform-origin) rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5 transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/6%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
						className,
					)}
				>
					<AutocompletePrimitive.Popup
						className="flex max-h-[min(var(--available-height),23rem)] w-(--anchor-width) max-w-(--available-width) flex-col text-foreground"
						data-slot="autocomplete-popup"
						{...props}
					>
						{children}
					</AutocompletePrimitive.Popup>
				</span>
			</AutocompletePrimitive.Positioner>
		</AutocompletePrimitive.Portal>
	);
}

function AutocompleteItem({
	className,
	children,
	...props
}: AutocompletePrimitive.Item.Props) {
	return (
		<AutocompletePrimitive.Item
			className={cn(
				"flex min-h-8 cursor-default select-none items-center rounded-sm px-2 py-1 text-base outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-64 sm:min-h-7 sm:text-sm",
				className,
			)}
			data-slot="autocomplete-item"
			{...props}
		>
			{children}
		</AutocompletePrimitive.Item>
	);
}

function AutocompleteSeparator({
	className,
	...props
}: AutocompletePrimitive.Separator.Props) {
	return (
		<AutocompletePrimitive.Separator
			className={cn("mx-2 my-1 h-px bg-border last:hidden", className)}
			data-slot="autocomplete-separator"
			{...props}
		/>
	);
}

function AutocompleteGroup({
	className,
	...props
}: AutocompletePrimitive.Group.Props) {
	return (
		<AutocompletePrimitive.Group
			className={cn("[[role=group]+&]:mt-1.5", className)}
			data-slot="autocomplete-group"
			{...props}
		/>
	);
}

function AutocompleteGroupLabel({
	className,
	...props
}: AutocompletePrimitive.GroupLabel.Props) {
	return (
		<AutocompletePrimitive.GroupLabel
			className={cn(
				"px-2 py-1.5 font-medium text-muted-foreground text-xs",
				className,
			)}
			data-slot="autocomplete-group-label"
			{...props}
		/>
	);
}

function AutocompleteEmpty({
	className,
	...props
}: AutocompletePrimitive.Empty.Props) {
	return (
		<AutocompletePrimitive.Empty
			className={cn(
				"not-empty:p-2 text-center text-base text-muted-foreground sm:text-sm",
				className,
			)}
			data-slot="autocomplete-empty"
			{...props}
		/>
	);
}

function AutocompleteRow({
	className,
	...props
}: AutocompletePrimitive.Row.Props) {
	return (
		<AutocompletePrimitive.Row
			className={className}
			data-slot="autocomplete-row"
			{...props}
		/>
	);
}

function AutocompleteValue({ ...props }: AutocompletePrimitive.Value.Props) {
	return (
		<AutocompletePrimitive.Value data-slot="autocomplete-value" {...props} />
	);
}

function AutocompleteList({
	className,
	...props
}: AutocompletePrimitive.List.Props) {
	return (
		<ScrollArea scrollbarGutter scrollFade>
			<AutocompletePrimitive.List
				className={cn(
					"not-empty:scroll-py-1 not-empty:p-1 in-data-has-overflow-y:pe-3",
					className,
				)}
				data-slot="autocomplete-list"
				{...props}
			/>
		</ScrollArea>
	);
}

function AutocompleteClear({
	className,
	...props
}: AutocompletePrimitive.Clear.Props) {
	return (
		<AutocompletePrimitive.Clear
			className={cn(
				"-translate-y-1/2 absolute end-0.5 top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent opacity-80 outline-none transition-[color,background-color,box-shadow,opacity] pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 sm:size-7 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-slot="autocomplete-clear"
			{...props}
		>
			<XIcon />
		</AutocompletePrimitive.Clear>
	);
}

function AutocompleteStatus({
	className,
	...props
}: AutocompletePrimitive.Status.Props) {
	return (
		<AutocompletePrimitive.Status
			className={cn(
				"px-3 py-2 font-medium text-muted-foreground text-xs empty:m-0 empty:p-0",
				className,
			)}
			data-slot="autocomplete-status"
			{...props}
		/>
	);
}

function AutocompleteCollection({
	...props
}: AutocompletePrimitive.Collection.Props) {
	return (
		<AutocompletePrimitive.Collection
			data-slot="autocomplete-collection"
			{...props}
		/>
	);
}

function AutocompleteTrigger({
	className,
	asChild,
	children,
	...props
}: AutocompletePrimitive.Trigger.Props & { asChild?: boolean }) {
	let finalRender = props.render;
	let finalChildren = children;
	if (asChild && !props.render && React.isValidElement(children)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const childElement = children as React.ReactElement<any>;
		finalRender = React.cloneElement(childElement, { children: undefined });
		finalChildren = childElement.props.children;
	}
	return (
		<AutocompletePrimitive.Trigger
			className={className}
			data-slot="autocomplete-trigger"
			{...props}
			render={finalRender}
		>
			{finalChildren}
		</AutocompletePrimitive.Trigger>
	);
}

const useAutocompleteFilter = AutocompletePrimitive.useFilter;

export {
	Autocomplete,
	AutocompleteInput,
	AutocompleteTrigger,
	AutocompletePopup,
	AutocompleteItem,
	AutocompleteSeparator,
	AutocompleteGroup,
	AutocompleteGroupLabel,
	AutocompleteEmpty,
	AutocompleteValue,
	AutocompleteList,
	AutocompleteClear,
	AutocompleteStatus,
	AutocompleteRow,
	AutocompleteCollection,
	useAutocompleteFilter,
};

// Legacy component for backward compatibility
// This was a custom component that was part of the original codebase

import { useEffect, useState } from "react";

type AutocompleteDropdownProps<T> = {
	open: boolean;
	items: T[];
	getKey: (item: T) => string | number;
	renderItem: (item: T) => React.ReactNode;
	onSelect: (item: T) => void;
	className?: string;
	loading?: boolean;
	skeletonCount?: number;
	renderSkeleton?: () => React.ReactNode;
};

function AutocompleteDropdown<T>({
	open,
	items,
	getKey,
	renderItem,
	onSelect,
	className,
	loading = false,
	skeletonCount = 4,
	renderSkeleton,
}: AutocompleteDropdownProps<T>) {
	const [entered, setEntered] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setEntered(true));
		return () => cancelAnimationFrame(id);
	}, []);
	if (!open) {
		return null;
	}
	return (
		<div
			className={[
				"absolute top-full right-0 left-0 z-30 mt-2 rounded-md border border-neutral-800 bg-neutral-900/90 shadow backdrop-blur transition-all duration-150 ease-out",
				entered
					? "translate-y-0 scale-100 opacity-100"
					: "translate-y-1 scale-95 opacity-0",
				className || "",
			].join(" ")}
		>
			<div className="max-h-64 overflow-auto py-1">
				{items.map((item) => (
					<button
						className="w-full border-neutral-800/50 border-b px-3 py-2 text-left text-neutral-300 transition-all duration-150 last:border-b-0 hover:translate-x-0.5 hover:bg-neutral-800/40 focus:bg-neutral-800/40 focus:outline-none"
						key={getKey(item)}
						onClick={() => onSelect(item)}
						type="button"
					>
						{renderItem(item)}
					</button>
				))}
				{loading && items.length === 0 && (
					<div className="px-3 py-2">
						{Array.from({ length: skeletonCount }).map((_, i) => (
							<div
								className="mb-1 animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3 last:mb-0"
								key={i}
							>
								{renderSkeleton ? (
									renderSkeleton()
								) : (
									<>
										<div className="mb-2 h-4 w-40 rounded bg-neutral-800" />
										<div className="h-3 w-24 rounded bg-neutral-800" />
									</>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export { AutocompleteDropdown };
