'use client';

import { CreateBountyWizard } from './create-bounty-wizard';

interface CreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
  mode?: 'create' | 'github-import';
  githubData?: {
    title?: string;
    description?: string;
    repositoryUrl?: string;
    issueUrl?: string;
  };
}

export function CreateBountyModal(props: CreateBountyModalProps) {
  return <CreateBountyWizard {...props} />;
}
