"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trpcClient } from "@/utils/trpc";
import type { LinearIssue } from "@bounty/api/driver/linear-client";
import { z } from "zod";
import {
	Loader2,
	X,
	ChevronDown,
	ChevronUp,
	RefreshCw,
	DollarSign,
} from "lucide-react";
import { Button } from "@bounty/ui/components/button";
import { GithubIcon } from "@bounty/ui";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
} from "@bounty/ui/components/dropdown-menu";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
} from "@bounty/ui/components/drawer";
import { useGitHubInstallationRepositories } from "@/hooks/use-github-installation-repos";
import { MarkdownContent } from "@/components/bounty/markdown-content";

const bountyFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(200, "Title too long"),
	description: z.string().min(10, "Description must be at least 10 characters"),
	amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, "Invalid amount"),
	deadline: z
		.string()
		.optional()
		.refine((val) => !(val && Number.isNaN(Date.parse(val))), {
			message: "Invalid date",
		}),
	tags: z.array(z.string()).optional(),
});

type BountyForm = z.infer<typeof bountyFormSchema>;

interface CreateBountyFormProps {
	issue: LinearIssue;
	onCancel: () => void;
	onSuccess: () => void;
}

function GitHubRepoSelector({
	selectedRepository,
	onSelect,
}: {
	selectedRepository: string;
	onSelect: (
		repo: string,
		installationId: number,
		owner: string,
		repoName: string,
	) => void;
}) {
	const [isMobile, setIsMobile] = useState(false);
	const [open, setOpen] = useState(false);
	const [selectedAccount, setSelectedAccount] = useState<{
		id: number;
		accountLogin: string | null;
	} | null>(null);
	const [accountSearchQuery, setAccountSearchQuery] = useState("");

	const { installationRepos, installations, reposLoading } =
		useGitHubInstallationRepositories();

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		if (!selectedRepository && installationRepos.length > 0 && !reposLoading) {
			const defaultInstall =
				installationRepos.find((i) => i.isDefault) || installationRepos[0];
			if (defaultInstall.repositories.length > 0) {
				const [owner, repoName] = defaultInstall.repositories[0].split("/");
				onSelect(
					defaultInstall.repositories[0],
					defaultInstall.installationId,
					owner,
					repoName,
				);
			}
		}
	}, [installationRepos, reposLoading, selectedRepository, onSelect]);

	const selectedAccountRepos = selectedAccount
		? installationRepos.find((r) => r.installationId === selectedAccount.id)
		: null;

	const TriggerButton = (
		<button
			type="button"
			onClick={() => setOpen(true)}
			className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors"
		>
			<GithubIcon className="w-4 h-4" />
			<span className="text-sm">
				{selectedRepository || "Select repository"}
			</span>
			<ChevronDown className="w-3 h-3" />
		</button>
	);

	const content = (
		<div className="flex flex-col">
			<div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
				{selectedAccount ? (
					<>
						<button
							type="button"
							onClick={() => {
								setSelectedAccount(null);
								setAccountSearchQuery("");
							}}
							className="p-1 -ml-1 rounded hover:bg-surface-2 text-text-secondary"
						>
							<ChevronUp className="w-4 h-4" />
						</button>
						<GithubIcon className="w-4 h-4 text-text-tertiary" />
						<span className="text-sm text-text-secondary">
							{selectedAccount.accountLogin ?? "Unknown"}
						</span>
					</>
				) : (
					<input
						className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-tertiary outline-none"
						placeholder="Search..."
						value={accountSearchQuery}
						onChange={(e) => setAccountSearchQuery(e.target.value)}
						autoComplete="off"
					/>
				)}
			</div>
			<div className="min-h-[200px] overflow-y-auto p-1">
				{selectedAccount
					? selectedAccountRepos?.repositories?.map((repo: string) => (
							<button
								key={repo}
								type="button"
								onClick={() => {
									const [owner, repoName] = repo.split("/");
									onSelect(repo, selectedAccount.id, owner, repoName);
									setSelectedAccount(null);
									setOpen(false);
								}}
								className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-surface-2 text-text-secondary"
							>
								<GithubIcon className="w-3.5 h-3.5 text-text-tertiary" />
								<span className="text-sm truncate">{repo}</span>
							</button>
						))
					: installations.map((account) => {
							const count =
								installationRepos.find((r) => r.installationId === account.id)
									?.repositories.length ?? 0;
							return (
								<button
									key={account.id}
									type="button"
									onClick={() => setSelectedAccount(account)}
									className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-surface-2 text-text-secondary"
								>
									<GithubIcon className="w-3.5 h-3.5 text-text-tertiary" />
									<span className="flex-1 text-sm truncate">
										{account.accountLogin ?? "Unknown"}
									</span>
									<span className="text-xs text-text-tertiary">{count}</span>
								</button>
							);
						})}
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
				<DrawerContent className="border-border-subtle bg-surface-1 rounded-t-xl">
					{content}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>{TriggerButton}</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-72 p-0 border-border-subtle bg-surface-1 rounded-xl"
				align="start"
				sideOffset={4}
			>
				{content}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function BountyFormHeader({ onCancel }: { onCancel: () => void }) {
	return (
		<div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
			<h2 className="text-sm font-medium">Create bounty</h2>
			<button
				type="button"
				onClick={onCancel}
				className="text-text-tertiary hover:text-text-secondary"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
}

function BountyAmountAndGithubRow({
	register,
	githubRepo,
	setGithubRepo,
}: {
	register: ReturnType<typeof useForm<BountyForm>>["register"];
	githubRepo: {
		selectedRepository: string;
		installationId: number | null;
		repoOwner: string | null;
		repoName: string | null;
	};
	setGithubRepo: React.Dispatch<
		React.SetStateAction<{
			selectedRepository: string;
			installationId: number | null;
			repoOwner: string | null;
			repoName: string | null;
		}>
	>;
}) {
	return (
		<div className="flex items-stretch gap-3">
			<div className="flex-1">
				<label
					className="block text-xs text-text-tertiary mb-1.5"
					htmlFor="bounty-amount"
				>
					Amount
				</label>
				<div className="relative">
					<DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
					<input
						id="bounty-amount"
						{...register("amount")}
						type="text"
						inputMode="decimal"
						className="w-full h-9 pl-8 pr-3 rounded-lg border border-border-subtle bg-surface-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-default"
						placeholder="0"
					/>
				</div>
			</div>
			<div className="flex-1">
				<label
					htmlFor="github-repo-selector"
					className="block text-xs text-text-tertiary mb-1.5"
				>
					GitHub
				</label>
				<div
					id="github-repo-selector"
					className="h-9 px-3 rounded-lg border border-border-subtle bg-surface-1 flex items-center"
					role="group"
					aria-label="GitHub repository selector"
				>
					<GitHubRepoSelector
						selectedRepository={githubRepo.selectedRepository}
						onSelect={(repo, installationId, owner, repoName) => {
							setGithubRepo({
								selectedRepository: repo,
								installationId,
								repoOwner: owner,
								repoName,
							});
						}}
					/>
				</div>
			</div>
		</div>
	);
}

function BountyTitleAndDescriptionFields({
	register,
	errors,
	description,
	issue,
	setValue,
	showPreview,
	onTogglePreview,
}: {
	register: ReturnType<typeof useForm<BountyForm>>["register"];
	errors: ReturnType<typeof useForm<BountyForm>>["formState"]["errors"];
	description: string;
	issue: LinearIssue;
	setValue: ReturnType<typeof useForm<BountyForm>>["setValue"];
	showPreview: boolean;
	onTogglePreview: () => void;
}) {
	return (
		<>
			<div>
				<input
					{...register("title")}
					type="text"
					className="w-full px-0 py-2 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none border-b border-border-subtle focus:border-border-default transition-colors"
					placeholder="Title"
				/>
				{errors.title && (
					<p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
				)}
			</div>

			<div>
				<div className="flex items-center justify-between mb-2">
					<label
						className="text-xs text-text-tertiary"
						htmlFor="bounty-description"
					>
						Description
					</label>
					{issue.description && description !== issue.description && (
						<button
							type="button"
							onClick={() => setValue("description", issue.description ?? "")}
							className="text-xs flex items-center gap-1 text-text-tertiary hover:text-text-secondary"
						>
							<RefreshCw className="w-3 h-3" />
							Sync from Linear
						</button>
					)}
				</div>
				<textarea
					id="bounty-description"
					{...register("description")}
					rows={3}
					className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface-1 text-sm text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-border-default resize-none"
					placeholder="Describe the bounty requirements..."
				/>
				{errors.description && (
					<p className="text-xs text-red-400 mt-1">
						{errors.description.message}
					</p>
				)}
				{description && (
					<BountyFormPreview
						description={description}
						showPreview={showPreview}
						onTogglePreview={onTogglePreview}
					/>
				)}
			</div>
		</>
	);
}

function BountyFormPreview({
	description,
	showPreview,
	onTogglePreview,
}: {
	description: string;
	showPreview: boolean;
	onTogglePreview: () => void;
}) {
	return (
		<details className="mt-2">
			<summary
				onClick={(e) => {
					e.preventDefault();
					onTogglePreview();
				}}
				className="text-xs text-text-tertiary hover:text-text-secondary cursor-pointer"
			>
				{showPreview ? "Hide" : "Show"} preview
			</summary>
			{showPreview && (
				<div className="mt-2 p-3 rounded-lg bg-surface-1 border border-border-subtle">
					<MarkdownContent content={description} />
				</div>
			)}
		</details>
	);
}

function BountyOptionalFields({
	register,
	showOptional,
	onToggleOptional,
	tagInput,
	setTagInput,
	tags,
	addTag,
	removeTag,
	handleKeyDown,
}: {
	register: ReturnType<typeof useForm<BountyForm>>["register"];
	showOptional: boolean;
	onToggleOptional: () => void;
	tagInput: string;
	setTagInput: (value: string) => void;
	tags: string[];
	addTag: () => void;
	removeTag: (tag: string) => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
}) {
	return (
		<div>
			<button
				type="button"
				onClick={onToggleOptional}
				className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1"
			>
				{showOptional ? (
					<ChevronUp className="w-3 h-3" />
				) : (
					<ChevronDown className="w-3 h-3" />
				)}
				Optional
			</button>
			{showOptional && (
				<div className="mt-3 space-y-4">
					<div>
						<label
							className="block text-xs text-text-tertiary mb-1.5"
							htmlFor="bounty-deadline"
						>
							Deadline
						</label>
						<input
							id="bounty-deadline"
							{...register("deadline")}
							type="date"
							min={new Date().toISOString().split("T")[0]}
							className="w-full h-9 px-3 rounded-lg border border-border-subtle bg-surface-1 text-sm text-text-secondary focus:outline-none focus:border-border-default"
						/>
					</div>
					<div>
						<label
							className="block text-xs text-text-tertiary mb-1.5"
							htmlFor="bounty-tags"
						>
							Tags
						</label>
						<div className="flex gap-2">
							<input
								id="bounty-tags"
								type="text"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={handleKeyDown}
								className="flex-1 h-9 px-3 rounded-lg border border-border-subtle bg-surface-1 text-sm text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-border-default"
								placeholder="Add tag..."
							/>
							<button
								type="button"
								onClick={addTag}
								className="h-9 px-3 rounded-lg border border-border-subtle bg-surface-1 text-sm text-text-secondary hover:bg-surface-2"
							>
								Add
							</button>
						</div>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-2">
								{tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-1 border border-border-subtle text-xs text-text-secondary"
									>
										{tag}
										<button
											type="button"
											onClick={() => removeTag(tag)}
											className="hover:text-red-400"
										>
											<X className="w-3 h-3" />
										</button>
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function BountyFormFooter({
	onCancel,
	onSubmit,
	isSubmitting,
	isReady,
}: {
	onCancel: () => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	isReady: boolean;
}) {
	return (
		<div className="border-t border-border-subtle p-4">
			<div className="flex gap-2">
				<Button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					variant="outline"
					className="flex-1 h-9"
				>
					Cancel
				</Button>
				<Button
					type="button"
					onClick={onSubmit}
					disabled={!isReady}
					className="flex-1 h-9"
				>
					{isSubmitting ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						"Create"
					)}
				</Button>
			</div>
		</div>
	);
}

export function CreateBountyForm({
	issue,
	onCancel,
	onSuccess,
}: CreateBountyFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tagInput, setTagInput] = useState("");
	const [githubRepo, setGithubRepo] = useState<{
		selectedRepository: string;
		installationId: number | null;
		repoOwner: string | null;
		repoName: string | null;
	}>({
		selectedRepository: "",
		installationId: null,
		repoOwner: null,
		repoName: null,
	});
	const [uiState, setUiState] = useState({
		showOptional: false,
		showPreview: false,
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
	} = useForm<BountyForm>({
		resolver: zodResolver(bountyFormSchema),
		defaultValues: {
			title: issue.title,
			description: "",
			amount: "",
			deadline: "",
			tags: [],
		},
	});

	const tags = watch("tags") ?? [];
	const amount = watch("amount");
	const description = watch("description");

	const createBountyMutation = useMutation({
		mutationFn: async (data: BountyForm) => {
			return await trpcClient.bounties.createBounty.mutate({
				title: data.title,
				description: data.description,
				amount: data.amount,
				currency: "USD",
				deadline: data.deadline
					? new Date(data.deadline).toISOString()
					: undefined,
				tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
				payLater: true,
				linearIssueId: issue.id,
				linearIssueIdentifier: issue.identifier,
				linearIssueUrl: issue.url,
				githubInstallationId: githubRepo.installationId ?? undefined,
				githubRepoOwner: githubRepo.repoOwner ?? undefined,
				githubRepoName: githubRepo.repoName ?? undefined,
			});
		},
		onSuccess: (result, variables) => {
			toast.success("Bounty created!");
			queryClient.invalidateQueries({ queryKey: [["bounties"]] });
			trpcClient.linear.postComment
				.mutate({
					linearIssueId: issue.id,
					commentType: "bountyCreated",
					bountyData: {
						title: variables.title,
						amount: variables.amount,
						currency: "USD",
						bountyUrl: `${window.location.origin}/bounty/${result.data?.id ?? ""}`,
					},
				})
				.catch(console.error);
			onSuccess();
			if (result.data?.id) router.push(`/bounty/${result.data.id}`);
		},
		onError: (error: Error) => {
			console.error("Failed to create bounty:", error);
			toast.error(error.message || "Failed to create bounty");
		},
		onSettled: () => setIsSubmitting(false),
	});

	const onSubmit = (data: BountyForm) => {
		setIsSubmitting(true);
		createBountyMutation.mutate(data);
	};

	const addTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim())) {
			setValue("tags", [...tags, tagInput.trim()]);
			setTagInput("");
		}
	};

	const removeTag = (tag: string) =>
		setValue(
			"tags",
			tags.filter((t) => t !== tag),
		);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addTag();
		}
	};

	const isReady = amount && githubRepo.selectedRepository && !isSubmitting;

	return (
		<div className="flex flex-col h-full">
			<BountyFormHeader onCancel={onCancel} />

			<div className="flex-1 overflow-y-auto">
				<form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
					<BountyAmountAndGithubRow
						register={register}
						githubRepo={githubRepo}
						setGithubRepo={setGithubRepo}
					/>

					<BountyTitleAndDescriptionFields
						register={register}
						errors={errors}
						description={description}
						issue={issue}
						setValue={setValue}
						showPreview={uiState.showPreview}
						onTogglePreview={() =>
							setUiState((s) => ({ ...s, showPreview: !s.showPreview }))
						}
					/>

					<BountyOptionalFields
						register={register}
						showOptional={uiState.showOptional}
						onToggleOptional={() =>
							setUiState((s) => ({ ...s, showOptional: !s.showOptional }))
						}
						tagInput={tagInput}
						setTagInput={setTagInput}
						tags={tags}
						addTag={addTag}
						removeTag={removeTag}
						handleKeyDown={handleKeyDown}
					/>
				</form>
			</div>

			<BountyFormFooter
				onCancel={onCancel}
				onSubmit={handleSubmit(onSubmit)}
				isSubmitting={isSubmitting}
				isReady={!!isReady}
			/>
		</div>
	);
}
