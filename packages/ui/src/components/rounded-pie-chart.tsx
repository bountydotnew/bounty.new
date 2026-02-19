"use client";

import { Badge } from "@bounty/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@bounty/ui/components/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@bounty/ui/components/chart";
import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";
import type { ChartConfig } from "../types/charts";

export const description = "A pie chart with a label list";

const chartData = [
	{ browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
	{ browser: "safari", visitors: 200, fill: "var(--color-safari)" },
	{ browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
	{ browser: "edge", visitors: 173, fill: "var(--color-edge)" },
	{ browser: "other", visitors: 90, fill: "var(--color-other)" },
];

const chartConfig = {
	visitors: {
		label: "Visitors",
	},
	chrome: {
		label: "Chrome",
		color: "var(--chart-1)",
	},
	safari: {
		label: "Safari",
		color: "var(--chart-2)",
	},
	firefox: {
		label: "Firefox",
		color: "var(--chart-3)",
	},
	edge: {
		label: "Edge",
		color: "var(--chart-4)",
	},
	other: {
		label: "Other",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

export function RoundedPieChart() {
	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>
					Pie Chart
					<Badge
						className="ml-2 border-none bg-green-500/10 text-green-500"
						variant="outline"
					>
						<TrendingUp className="h-4 w-4" />
						<span>5.2%</span>
					</Badge>
				</CardTitle>
				<CardDescription>January - June 2024</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
					config={chartConfig}
				>
					<PieChart>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel nameKey="visitors" />}
						/>
						<Pie
							cornerRadius={8}
							data={chartData}
							dataKey="visitors"
							innerRadius={30}
							paddingAngle={4}
							radius={10}
						>
							<LabelList
								dataKey="visitors"
								fill="currentColor"
								fontSize={12}
								fontWeight={500}
								formatter={(value: React.ReactNode) => value?.toString()}
								stroke="none"
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
