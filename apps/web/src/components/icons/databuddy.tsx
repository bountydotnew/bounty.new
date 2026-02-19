import type React from "react";

interface DataBuddyIconProps {
	className?: string;
	size?: number;
}

export const DataBuddyIcon: React.FC<DataBuddyIconProps> = ({
	className = "",
	size = 32,
}) => {
	return (
		<svg
			className={className}
			height={size}
			shapeRendering="crispEdges"
			viewBox="0 0 8 8"
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M0 0h8v8H0z" />
			<path
				d="M1 1h1v6H1zm1 0h4v1H2zm4 1h1v1H6zm0 1h1v1H6zm0 1h1v1H6zm0 1h1v1H6zM2 6h4v1H2zm1-3h1v1H3zm1 1h1v1H4z"
				fill="#fff"
			/>
		</svg>
	);
};
