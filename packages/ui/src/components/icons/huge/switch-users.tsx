"use client";

import { cn } from "@bounty/ui/lib/utils";
import type { Variants } from "motion/react";
import { useAnimation, m } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export interface SwitchUsersIconHandle {
	startAnimation: () => void;
	stopAnimation: () => void;
}

interface SwitchUsersIconProps extends HTMLAttributes<HTMLDivElement> {
	size?: number;
}

const pathVariant: Variants = {
	normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
	animate: {
		pathLength: [0, 1],
		opacity: [0, 1],
		pathOffset: [1, 0],
	},
};

const SwitchUsersIcon = forwardRef<SwitchUsersIconHandle, SwitchUsersIconProps>(
	({ onMouseEnter, onMouseLeave, className, size = 24, ...props }, ref) => {
		const controls = useAnimation();
		const isControlledRef = useRef(false);

		useImperativeHandle(ref, () => {
			isControlledRef.current = true;

			return {
				startAnimation: () => controls.start("animate"),
				stopAnimation: () => controls.start("normal"),
			};
		});

		const handleMouseEnter = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (isControlledRef.current) {
					onMouseEnter?.(e);
				} else {
					controls.start("animate");
				}
			},
			[controls, onMouseEnter],
		);

		const handleMouseLeave = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (isControlledRef.current) {
					onMouseLeave?.(e);
				} else {
					controls.start("normal");
				}
			},
			[controls, onMouseLeave],
		);

		return (
			<div
				className={cn(className)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				{...props}
			>
				<svg
					fill="none"
					height={size}
					viewBox="0 0 24 24"
					width={size}
					xmlns="http://www.w3.org/2000/svg"
				>
					<m.path
						animate={controls}
						d="M15.6853 16.416C13.4221 16.9995 11.75 19.0545 11.75 21.5C11.75 21.9142 12.0858 22.25 12.5 22.25H21.5C21.9142 22.25 22.25 21.9142 22.25 21.5C22.25 19.0545 20.5779 16.9995 18.3147 16.416C19.1698 15.9497 19.75 15.0426 19.75 14C19.75 12.4812 18.5188 11.25 17 11.25C15.4812 11.25 14.25 12.4812 14.25 14C14.25 15.0426 14.8302 15.9497 15.6853 16.416Z"
						fill="currentColor"
						transition={{
							delay: 0.1,
							duration: 0.4,
						}}
						variants={pathVariant}
					/>
					<m.path
						animate={controls}
						d="M5.68529 6.91597C3.42205 7.49954 1.75 9.55451 1.75 12C1.75 12.4142 2.08579 12.75 2.5 12.75H11.5C11.9142 12.75 12.25 12.4142 12.25 12C12.25 9.55451 10.5779 7.49954 8.31471 6.91597C9.16982 6.44965 9.75 5.54258 9.75 4.5C9.75 2.98122 8.51878 1.75 7 1.75C5.48122 1.75 4.25 2.98122 4.25 4.5C4.25 5.54258 4.83018 6.44965 5.68529 6.91597Z"
						fill="currentColor"
						transition={{
							duration: 0.4,
						}}
						variants={pathVariant}
					/>
					<m.path
						animate={controls}
						clipRule="evenodd"
						d="M3.5 14.5C4.05228 14.5 4.5 14.9477 4.5 15.5C4.5 17.2426 5.60966 18.722 7.16209 19.2715L7.02986 18.7425C6.89591 18.2067 7.22167 17.6638 7.75746 17.5299C8.29326 17.3959 8.83619 17.7217 8.97014 18.2575L9.47014 20.2575C9.54483 20.5562 9.47771 20.8727 9.28821 21.1154C9.0987 21.3581 8.80794 21.5 8.5 21.5C5.18343 21.5 2.5 18.8166 2.5 15.5C2.5 14.9477 2.94772 14.5 3.5 14.5Z"
						fill="currentColor"
						fillRule="evenodd"
						transition={{
							delay: 0.2,
							duration: 0.4,
						}}
						variants={pathVariant}
					/>
					<m.path
						animate={controls}
						clipRule="evenodd"
						d="M12.7118 2.88459C12.9013 2.64187 13.1921 2.5 13.5 2.5C16.8166 2.5 19.5 5.18343 19.5 8.5C19.5 9.05228 19.0523 9.5 18.5 9.5C17.9477 9.5 17.5 9.05228 17.5 8.5C17.5 6.75741 16.3904 5.27796 14.8379 4.72852L14.9702 5.25746C15.1041 5.79326 14.7783 6.33619 14.2425 6.47014C13.7067 6.60409 13.1638 6.27833 13.0299 5.74254L12.5299 3.74254C12.4552 3.44379 12.5223 3.1273 12.7118 2.88459Z"
						fill="currentColor"
						fillRule="evenodd"
						transition={{
							delay: 0.3,
							duration: 0.4,
						}}
						variants={pathVariant}
					/>
				</svg>
			</div>
		);
	},
);

SwitchUsersIcon.displayName = "SwitchUsersIcon";

export { SwitchUsersIcon };
