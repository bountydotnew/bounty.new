interface BalanceCardProps {
	balance: number;
	backgroundUrl?: string;
}

export function BalanceCard({ balance, backgroundUrl }: BalanceCardProps) {
	// Default artistic background if none provided
	const defaultBackground =
		"https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=250&fit=crop";

	return (
		<div className="w-[265px] h-[166px] rounded-[19px] opacity-100 overflow-clip relative bg-origin-border bg-cover bg-center border border-solid border-[#2E2E2E] shrink-0">
			{/* Background Image */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `url(${backgroundUrl || defaultBackground})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			/>

			{/* Dark overlay for text readability */}
			<div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />

			{/* Balance - Top Left */}
			<div
				className="text-[12px] leading-[150%] tracking-[0.03em] absolute bg-clip-text text-transparent font-bold left-0 top-0 size-fit whitespace-nowrap"
				style={{
					backgroundImage:
						"linear-gradient(in oklab 180deg, oklab(100% 0 0) 0%, oklab(100% 0 0) 100%)",
					translate: "13px 11px",
				}}
			>
				${balance.toFixed(2)}
			</div>

			{/* Label - Below Balance */}
			<div
				className="text-[9px] leading-[150%] tracking-[0.03em] shrink-0 absolute bg-clip-text text-transparent font-medium left-0 top-0 size-fit whitespace-nowrap"
				style={{
					backgroundImage:
						"linear-gradient(in oklab 180deg, oklab(100% 0 0) 0%, oklab(100% 0 0) 100%)",
					translate: "13px 27px",
				}}
			>
				current balance
			</div>

			{/* Chip - Left Middle (now served locally) */}
			<div
				className="w-[41px] h-[31px] absolute bg-cover bg-center left-0 top-0"
				style={{
					backgroundImage: "url(/images/chip.svg)",
					translate: "13px 66px",
				}}
			/>

			{/* No icon - per user request */}
		</div>
	);
}
