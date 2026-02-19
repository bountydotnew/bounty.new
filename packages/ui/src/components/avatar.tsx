"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { Facehash } from "facehash";

import { cn } from "@bounty/ui/lib/utils";

function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
	return (
		<AvatarPrimitive.Root
			className={cn(
				"inline-flex size-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-background align-middle font-medium text-xs",
				className,
			)}
			data-slot="avatar"
			{...props}
		/>
	);
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
	return (
		<AvatarPrimitive.Image
			className={cn("size-full object-cover", className)}
			data-slot="avatar-image"
			{...props}
		/>
	);
}

function AvatarFallback({
	className,
	...props
}: AvatarPrimitive.Fallback.Props) {
	return (
		<AvatarPrimitive.Fallback
			className={cn(
				"flex size-full items-center justify-center rounded-full bg-muted",
				className,
			)}
			data-slot="avatar-fallback"
			{...props}
		/>
	);
}

type AvatarFacehashProps = Omit<AvatarPrimitive.Fallback.Props, "children"> & {
	name: string;
	size?: number;
};

const FACEHASH_COLOR_CLASSES = [
	"bg-pink-400 dark:bg-pink-500",
	"bg-blue-400 dark:bg-blue-500",
	"bg-purple-400 dark:bg-purple-500",
	"bg-teal-400 dark:bg-teal-500",
	"bg-orange-400 dark:bg-orange-500",
	"bg-indigo-400 dark:bg-indigo-500",
	"bg-emerald-400 dark:bg-emerald-500",
	"bg-rose-400 dark:bg-rose-500",
];

function AvatarFacehash({
	className,
	name,
	size = 32,
	...props
}: AvatarFacehashProps) {
	return (
		<AvatarPrimitive.Fallback
			className={cn(
				"flex size-full items-center justify-center overflow-hidden",
				className,
			)}
			data-slot="avatar-fallback"
			{...props}
		>
			<Facehash
				name={name}
				size={size}
				variant="gradient"
				intensity3d="subtle"
				colorClasses={FACEHASH_COLOR_CLASSES}
			/>
		</AvatarPrimitive.Fallback>
	);
}

export { Avatar, AvatarImage, AvatarFallback, AvatarFacehash };
