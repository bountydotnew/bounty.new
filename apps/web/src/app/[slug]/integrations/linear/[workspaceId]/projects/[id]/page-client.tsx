"use client";

import { useQueries, skipToken } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { LinearIcon } from "@bounty/ui";
import { Button } from "@bounty/ui/components/button";
import { ArrowLeft, ExternalLink, Inbox, FolderKanban } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useIntegrations } from "@/hooks/use-integrations";
import { useOrgPath } from "@/hooks/use-org-path";
import { LinearIssueCard } from "../../issues/components/issue-card";
import type { LinearProject } from "@bounty/api/driver/linear-client";

export default function LinearProjectDetailPage() {
	const params = useParams();
	const router = useRouter();
	const orgPath = useOrgPath();
	const { hasLinear } = useIntegrations();
	const workspaceId = params.workspaceId as string;
	const projectId = params.id as string;

	// Fetch projects and issues in parallel using useQueries
	const [projectsQuery, issuesQuery] = useQueries({
		queries: [
			trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken),
			trpc.linear.getIssues.queryOptions(
				hasLinear
					? {
							filters: { projectId },
							pagination: { first: 50 },
						}
					: skipToken,
			),
		],
	});

	const projectsData = projectsQuery.data;
	const issuesData = issuesQuery.data;
	const projectLoading = projectsQuery.isLoading;
	const issuesLoading = issuesQuery.isLoading;

	const project = projectsData?.projects?.find(
		(p: LinearProject) => p.id === projectId,
	);
	const issues = issuesData?.issues ?? [];

	// Show skeleton while loading
	if (hasLinear && (projectLoading || issuesLoading)) {
		return <ProjectDetailSkeleton />;
	}

	if (!hasLinear) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
				<div className="w-full max-w-md text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
						<LinearIcon className="w-8 h-8 text-text-primary" />
					</div>
					<h1 className="text-2xl font-semibold text-foreground mb-2">
						Connect Linear
					</h1>
					<p className="text-sm text-neutral-400 mb-6">
						Connect your workspace to view projects
					</p>
					<Button
						onClick={() => router.push(orgPath("/integrations/linear"))}
						size="lg"
					>
						Go to Linear integration
					</Button>
				</div>
			</div>
		);
	}

	if (!(projectLoading || project)) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
				<div className="w-full max-w-md text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
						<Inbox className="w-8 h-8 text-text-muted" />
					</div>
					<h1 className="text-2xl font-semibold text-foreground mb-2">
						Project Not Found
					</h1>
					<p className="text-sm text-neutral-400 mb-6">
						The project you're looking for doesn't exist.
					</p>
					<Button
						onClick={() =>
							router.push(
								orgPath(`/integrations/linear/${workspaceId}/projects`),
							)
						}
						size="lg"
					>
						Back to Projects
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="flex items-start justify-between mb-8">
				<div className="flex items-center gap-4">
					<Button
						onClick={() =>
							router.push(
								orgPath(`/integrations/linear/${workspaceId}/projects`),
							)
						}
						variant="outline"
						size="icon"
						title="Back to Projects"
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>

					<div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">
						{project?.icon || (
							<FolderKanban className="w-6 h-6 text-neutral-500" />
						)}
					</div>

					<div>
						<h1 className="text-xl font-semibold text-foreground">
							{project?.name}
						</h1>
						<p className="text-sm text-neutral-500">
							{issues.length} {issues.length === 1 ? "issue" : "issues"}
						</p>
					</div>
				</div>

				<a
					href={project?.url}
					target="_blank"
					rel="noopener noreferrer"
					className="h-9 px-4 rounded-lg border border-white/10 text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2"
				>
					<ExternalLink className="w-4 h-4" />
					<span className="hidden sm:inline">Open in Linear</span>
				</a>
			</div>

			{/* Description */}
			{project?.description && (
				<div className="mb-8">
					<p className="text-sm text-neutral-400 leading-relaxed">
						{project.description}
					</p>
				</div>
			)}

			{/* Status */}
			{project?.status && (
				<div className="mb-8">
					<span className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-neutral-500">
						{project.status}
					</span>
				</div>
			)}

			{/* Issues */}
			<div>
				<h2 className="text-sm font-medium text-foreground mb-4">Issues</h2>

				{issues.length === 0 ? (
					<div className="py-16 flex flex-col items-center justify-center text-center">
						<div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
							<Inbox className="w-5 h-5 text-text-muted" />
						</div>
						<p className="text-sm text-foreground">No issues yet</p>
						<p className="text-xs text-neutral-500 mt-1">
							Issues from this project will appear here
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{issues.map((issue) => (
							<LinearIssueCard
								key={issue.id}
								issue={issue}
								isExpanded={false}
								workspaceId={workspaceId}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function ProjectDetailSkeleton() {
	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<div className="h-9 w-9 rounded bg-white/5 animate-pulse" />
					<div className="w-12 h-12 rounded bg-white/5 animate-pulse" />
					<div>
						<div className="h-6 w-40 rounded bg-white/5 mb-1 animate-pulse" />
						<div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
					</div>
				</div>
				<div className="h-9 w-28 rounded bg-white/5 animate-pulse" />
			</div>

			{/* Description */}
			<div className="mb-8 space-y-2">
				<div className="h-4 w-full rounded bg-white/5 animate-pulse" />
				<div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
			</div>

			{/* Issues */}
			<div>
				<div className="h-4 w-16 rounded bg-white/5 mb-4 animate-pulse" />
				<div className="space-y-3">
					{["issue1", "issue2", "issue3"].map((item) => (
						<div key={`project-skeleton-${item}`} className="animate-pulse">
							<div className="flex items-center gap-3 px-4 py-3 rounded-lg">
								<div className="w-16 h-5 rounded bg-white/5 shrink-0" />
								<div className="flex-1 h-4 rounded bg-white/5" />
								<div className="w-20 h-5 rounded bg-white/5 shrink-0" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
