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
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "../types/charts";

const chartData = [
	{ month: "January", desktop: 342, mobile: 245 },
	{ month: "February", desktop: 876, mobile: 654 },
	{ month: "March", desktop: 512, mobile: 387 },
	{ month: "April", desktop: 629, mobile: 521 },
	{ month: "May", desktop: 458, mobile: 412 },
	{ month: "June", desktop: 781, mobile: 598 },
	{ month: "July", desktop: 394, mobile: 312 },
	{ month: "August", desktop: 925, mobile: 743 },
	{ month: "September", desktop: 647, mobile: 489 },
	{ month: "October", desktop: 532, mobile: 476 },
	{ month: "November", desktop: 803, mobile: 687 },
	{ month: "December", desktop: 271, mobile: 198 },
];

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
	mobile: {
		label: "Mobile",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export function GradientAreaChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Area Chart
					<Badge
						className="ml-2 border-none bg-green-500/10 text-green-500"
						variant="outline"
					>
						<TrendingUp className="h-4 w-4" />
						<span>5.2%</span>
					</Badge>
				</CardTitle>
				<CardDescription>
					Showing total visitors for the last 6 months
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart accessibilityLayer data={chartData}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="month"
							tickFormatter={(value) => value.slice(0, 3)}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
						<defs>
							<linearGradient
								id="gradient-chart-desktop"
								x1="0"
								x2="0"
								y1="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-desktop)"
									stopOpacity={0.5}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-desktop)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient
								id="gradient-chart-mobile"
								x1="0"
								x2="0"
								y1="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-mobile)"
									stopOpacity={0.5}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-mobile)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<Area
							dataKey="mobile"
							fill="url(#gradient-chart-mobile)"
							fillOpacity={0.4}
							stackId="a"
							stroke="var(--color-mobile)"
							strokeDasharray={"3 3"}
							strokeWidth={0.8}
						/>
						<Area
							dataKey="desktop"
							fill="url(#gradient-chart-desktop)"
							fillOpacity={0.4}
							stackId="a"
							stroke="var(--color-desktop)"
							strokeDasharray={"3 3"}
							strokeWidth={0.8}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
