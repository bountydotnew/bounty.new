import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";

export function useBranches(
	selectedRepository: string,
	options: {
		defaultBranchQueryOptions: Parameters<typeof useQuery>[0];
		branchesQueryOptions: Parameters<typeof useQuery>[0];
	},
) {
	const { data: defaultBranchData } = useQuery({
		...options.defaultBranchQueryOptions,
		enabled: !!selectedRepository,
		staleTime: 60_000, // 1 minute
	});

	const { data: branchesData, isLoading: branchesLoading } = useQuery({
		...options.branchesQueryOptions,
		enabled: !!selectedRepository,
		staleTime: 60_000, // 1 minute
	});

	const branches: string[] = (branchesData as string[]) || [];
	const [branchSearchQuery, setBranchSearchQuery] = useState("");
	const [selectedBranch, setSelectedBranch] = useState<string>("main");

	// Filter branches based on search query
	const filteredBranches = useMemo(() => {
		if (!branchSearchQuery) {
			return branches;
		}
		const query = branchSearchQuery.toLowerCase();
		return branches.filter((branch: string) =>
			branch.toLowerCase().includes(query),
		);
	}, [branches, branchSearchQuery]);

	// Set default branch when repository changes or default branch is fetched
	useEffect(() => {
		if (selectedRepository && defaultBranchData) {
			setSelectedBranch(defaultBranchData as string);
		} else if (
			selectedRepository &&
			branches.length > 0 &&
			!defaultBranchData
		) {
			const fallbackBranch =
				branches.find((b: string) => b === "main" || b === "master") ||
				branches[0];
			if (fallbackBranch) {
				setSelectedBranch(fallbackBranch);
			}
		}
	}, [selectedRepository, defaultBranchData, branches]);

	return {
		branches,
		filteredBranches,
		branchesLoading,
		branchSearchQuery,
		setBranchSearchQuery,
		selectedBranch,
		setSelectedBranch,
	};
}
