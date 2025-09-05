import type { AppRouter } from '@bounty/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import { CheckCircle, ExternalLink, Eye, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Favicon } from '@bounty/ui/components/favicon';
import { Textarea } from '@bounty/ui/components/textarea';
import type { BetaApplication } from '@/types/beta-application';
import { trpc } from '@/utils/trpc';

interface BetaApplicationCardProps {
  application: BetaApplication;
}

export function BetaApplicationCard({ application }: BetaApplicationCardProps) {
  const [selectedApplication, setSelectedApplication] =
    useState<BetaApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    ...trpc.betaApplications.updateStatus.mutationOptions(),
    onSuccess: () => {
      toast.success('Application status updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['betaApplications', 'getAll'],
      });
      setIsReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || 'Failed to update application status');
    },
  });

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    if (!selectedApplication) {
      return;
    }

    updateStatusMutation.mutate({
      id: selectedApplication.id,
      status,
      reviewNotes: reviewNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Favicon size={24} url={application.projectLink} />
            <div>
              <h3 className="font-semibold tracking-tight">
                {application.projectName}
              </h3>
              <p className="text-neutral-400 text-xs">
                by {application.user?.name || 'Unknown'} (
                {application.user?.email || 'No email'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(application.status)}
            <Button
              className="border-neutral-800 bg-neutral-900/70"
              onClick={() => {
                setSelectedApplication(application);
                setIsReviewDialogOpen(true);
              }}
              size="sm"
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              Review
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Name:</span> {application.name}
          </div>
          <div>
            <span className="font-medium">Twitter:</span> {application.twitter}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium">Project Link:</span>{' '}
            <a
              className="inline-flex items-center gap-1 text-primary hover:underline"
              href={application.projectLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              {application.projectLink}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium">Description:</span>
            <p className="mt-1 text-muted-foreground">
              {application.description}
            </p>
          </div>
        </div>

        {application.reviewNotes && (
          <div className="rounded-md bg-muted p-3">
            <span className="font-medium">Review Notes:</span>
            <p className="mt-1 text-muted-foreground text-sm">
              {application.reviewNotes}
            </p>
          </div>
        )}
      </div>

      <Dialog onOpenChange={setIsReviewDialogOpen} open={isReviewDialogOpen}>
        <DialogContent className="max-w-2xl border border-neutral-800 bg-neutral-900/90 p-0 backdrop-blur">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-white">Review Application</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Review the application and decide whether to approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-5 px-6 pb-6">
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
                    className="block text-primary hover:underline"
                    href={selectedApplication.projectLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {selectedApplication.projectLink}
                  </a>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-neutral-400">
                    {selectedApplication.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <label className="text-sm">Review Notes (optional)</label>
                <Textarea
                  className="mt-1 border-neutral-800 bg-neutral-900/60 text-white"
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                />
                <div className="text-neutral-500 text-xs">
                  {reviewNotes.length}/500
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 px-6 pb-6">
            <Button
              className="border-neutral-800"
              onClick={() => setIsReviewDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={updateStatusMutation.isPending}
              onClick={() => handleStatusUpdate('rejected')}
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {reviewNotes.trim().length === 0
                ? 'Reject without reason'
                : 'Reject'}
            </Button>
            <Button
              className="border-neutral-800"
              disabled={updateStatusMutation.isPending}
              onClick={() => handleStatusUpdate('approved')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {reviewNotes.trim().length === 0
                ? 'Approve without reason'
                : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
