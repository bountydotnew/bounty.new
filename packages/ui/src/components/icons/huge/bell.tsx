import type React from "react";

export const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
		role="img"
		aria-label="Bell"
	>
		<path
			d="M14.25 20C14.25 21.2426 13.2426 22.25 12 22.25C10.7574 22.25 9.75 21.2426 9.75 20H14.25ZM12 1.75C16.2802 1.75 19.75 5.21979 19.75 9.5V16.75H20.25C20.8023 16.75 21.25 17.1977 21.25 17.75C21.25 18.3023 20.8023 18.75 20.25 18.75H3.75C3.19772 18.75 2.75 18.3023 2.75 17.75C2.75 17.1977 3.19772 16.75 3.75 16.75H4.25V9.5C4.25 5.21979 7.71979 1.75 12 1.75Z"
			fill="currentColor"
		/>
	</svg>
);
