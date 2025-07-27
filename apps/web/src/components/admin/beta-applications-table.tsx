"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@bounty/api";

type BetaApplication = {
    id: string;
    name: string;
    twitter: string;
    projectName: string;
    projectLink: string;
    description: string;
    status: "pending" | "approved" | "rejected";
    reviewNotes?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
    } | null;
};

interface BetaApplicationsTableProps {
    applications: BetaApplication[];
    total: number;
    isLoading: boolean;
}

export function BetaApplicationsTable({ applications, total, isLoading }: BetaApplicationsTableProps) {
    const [selectedApplication, setSelectedApplication] = useState<BetaApplication | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        ...trpc.betaApplications.updateStatus.mutationOptions(),
        onSuccess: () => {
            toast.success("Application status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["betaApplications", "getAll"] });
            setIsReviewDialogOpen(false);
            setSelectedApplication(null);
            setReviewNotes("");
        },
        onError: (error: TRPCClientErrorLike<AppRouter>) => {
            toast.error(error.message || "Failed to update application status");
        },
    });

    const handleStatusUpdate = (status: "approved" | "rejected") => {
        if (!selectedApplication) return;

        updateStatusMutation.mutate({
            id: selectedApplication.id,
            status,
            reviewNotes: reviewNotes || undefined,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="secondary">Pending</Badge>;
            case "approved":
                return <Badge variant="default">Approved</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Applications ({total})</CardTitle>
                    <CardDescription>
                        Review applications and grant beta access
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p>Loading applications...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => (
                                <div key={app.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="font-semibold">{app.projectName}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    by {app.user?.name || "Unknown"} ({app.user?.email || "No email"})
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(app.status)}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedApplication(app);
                                                    setIsReviewDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Name:</span> {app.name}
                                        </div>
                                        <div>
                                            <span className="font-medium">Twitter:</span> {app.twitter}
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="font-medium">Project Link:</span>{" "}
                                            <a
                                                href={app.projectLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                {app.projectLink}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="font-medium">Description:</span>
                                            <p className="text-muted-foreground mt-1">{app.description}</p>
                                        </div>
                                    </div>

                                    {app.reviewNotes && (
                                        <div className="bg-muted p-3 rounded-md">
                                            <span className="font-medium">Review Notes:</span>
                                            <p className="text-sm text-muted-foreground mt-1">{app.reviewNotes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {applications.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No applications found</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Application</DialogTitle>
                        <DialogDescription>
                            Review the application and decide whether to approve or reject
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApplication && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium">Name:</span>
                                    <p>{selectedApplication.name}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Twitter:</span>
                                    <p>{selectedApplication.twitter}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Project:</span>
                                    <p>{selectedApplication.projectName}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Project Link:</span>
                                    <a
                                        href={selectedApplication.projectLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline block"
                                    >
                                        {selectedApplication.projectLink}
                                    </a>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Description:</span>
                                    <p className="text-muted-foreground">{selectedApplication.description}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Review Notes (optional):</label>
                                <Textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about your decision..."
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsReviewDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleStatusUpdate("rejected")}
                            disabled={updateStatusMutation.isPending}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                        <Button
                            onClick={() => handleStatusUpdate("approved")}
                            disabled={updateStatusMutation.isPending}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 