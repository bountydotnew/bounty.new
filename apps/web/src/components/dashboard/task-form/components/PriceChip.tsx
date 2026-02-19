import { useState } from "react";
import { Controller, type Control } from "react-hook-form";
import type { CreateBountyForm } from "@bounty/ui/lib/forms";
import { calculateWidth } from "@bounty/ui/lib/calculate-width";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@bounty/ui/components/popover";
import { ChevronSortIcon } from "@bounty/ui/components/icons/huge/chevron-sort";

interface PriceChipProps {
	control: Control<CreateBountyForm>;
}

function formatPrice(value: string): string {
	if (!value) {
		return "";
	}
	const parts = value.split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

export function PriceChip({ control }: PriceChipProps) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div className="rounded-full flex justify-center items-center px-[6px] py-[3px] shrink-0 gap-2 bg-surface-hover border border-solid border-border-subtle hover:border-border-default transition-colors cursor-pointer">
					<Controller
						control={control}
						name="amount"
						render={({ field }) => {
							const displayValue = formatPrice(field.value) || "Price";
							return (
								<span
									className={`text-[16px] leading-5 font-sans ${
										field.value ? "text-foreground" : "text-text-muted"
									}`}
								>
									{displayValue}
								</span>
							);
						}}
					/>
					<ChevronSortIcon className="size-2 text-text-muted shrink-0" />
				</div>
			</PopoverTrigger>
			<PopoverContent
				className="w-48 px-3 bg-surface-1 border-border-subtle rounded-xl py-0"
				align="start"
				sideOffset={8}
			>
				<Controller
					control={control}
					name="amount"
					render={({ field }) => (
						<div className="flex items-center gap-2">
							<span className="text-text-tertiary text-[16px]">$</span>
							<input
								ref={field.ref}
								type="text"
								value={field.value}
								onChange={(e) =>
									field.onChange(e.target.value.replace(/[^0-9.]/g, ""))
								}
								placeholder="0.00"
								className="flex-1 bg-transparent text-foreground text-[16px] leading-5 outline-none placeholder:text-text-tertiary"
							/>
						</div>
					)}
				/>
			</PopoverContent>
		</Popover>
	);
}
