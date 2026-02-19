"use client";

import { Button } from "@bounty/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@bounty/ui/components/card";
import { Dialog, DialogContent } from "@bounty/ui/components/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@bounty/ui/components/drawer";
import { Input } from "@bounty/ui/components/input";
import { useIsMobile } from "@bounty/ui/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/utils/trpc";

interface Props {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onPick: (userId: string) => void;
}

export function ImpersonationUserPicker({ open, onOpenChange, onPick }: Props) {
	const isMobile = useIsMobile();
	const [search, setSearch] = useState("");

	const { data, isLoading } = useQuery(
		trpc.user.getAllUsers.queryOptions({
			search: search || undefined,
			page: 1,
			limit: 20,
		}),
	);

	type UserListItem = {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
		role: string;
		banned: boolean;
		createdAt: string;
		updatedAt: string;
	};

	const users = useMemo(
		() => (data?.users || []) as UserListItem[],
		[data?.users],
	);

	const content = (
		<div className="p-4">
			<Card className="border-neutral-800 bg-neutral-900/50">
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Impersonate user</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center gap-2">
						<Search className="h-4 w-4 text-neutral-500" />
						<Input
							className="border-neutral-800 bg-neutral-900"
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search users..."
							value={search}
						/>
					</div>
					<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
						{isLoading ? (
							<div className="text-neutral-500 text-sm">Loading...</div>
						) : users.length ? (
							users.map((u) => (
								<button
									className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-left transition hover:bg-neutral-900/60"
									key={u.id}
									onClick={() => onPick(u.id)}
									type="button"
								>
									<div className="flex items-center gap-2">
										<User className="h-4 w-4 text-neutral-500" />
										<div>
											<div className="font-medium text-sm">{u.name}</div>
											<div className="text-neutral-400 text-xs">{u.email}</div>
										</div>
									</div>
								</button>
							))
						) : (
							<div className="text-neutral-500 text-sm">No users</div>
						)}
					</div>
					<div className="flex justify-end">
						<Button
							onClick={() => onOpenChange(false)}
							size="sm"
							variant="outline"
						>
							Close
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer onOpenChange={onOpenChange} open={open}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Impersonate user</DrawerTitle>
					</DrawerHeader>
					{content}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="p-0">{content}</DialogContent>
		</Dialog>
	);
}
