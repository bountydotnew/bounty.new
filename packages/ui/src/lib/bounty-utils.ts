'use client';

import { useState } from 'react';

// Hook for managing bounty modal states
export function useBountyModals() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBountyId, setEditingBountyId] = useState<string>('');
  const [createDraftId, setCreateDraftId] = useState<string>('');

  const openCreateModal = (draftId?: string) => {
    setCreateDraftId(draftId || '');
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateDraftId('');
  };

  const openEditModal = (bountyId: string) => {
    setEditingBountyId(bountyId);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingBountyId('');
  };

  return {
    // Create modal
    createModalOpen,
    openCreateModal,
    closeCreateModal,
    createDraftId,

    // Edit modal
    editModalOpen,
    openEditModal,
    closeEditModal,
    editingBountyId,
  };
}

// Utility functions for bounty status
export const getBountyStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'open':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Format bounty amount for display
export const formatBountyAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Check if user can edit bounty
export const canEditBounty = (
  bounty: { createdById: string; status: string },
  userId: string
) => {
  return (
    bounty.createdById === userId &&
    bounty.status !== 'completed' &&
    bounty.status !== 'cancelled'
  );
};

// Get relative time string
export const getRelativeTime = (date: string | Date) => {
  const now = new Date();
  const bountyDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - bountyDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return 'just now';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86_400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 2_592_000) {
    const days = Math.floor(diffInSeconds / 86_400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  return bountyDate.toLocaleDateString();
};

// Check if deadline is approaching
export const isDeadlineApproaching = (
  deadline: string | Date,
  daysThreshold = 3
) => {
  if (!deadline) {
    return false;
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffInDays = Math.floor(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffInDays <= daysThreshold && diffInDays >= 0;
};

// Check if deadline has passed
export const isDeadlinePassed = (deadline: string | Date) => {
  if (!deadline) {
    return false;
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);

  return deadlineDate < now;
};
