'use client';

import { CreateBountyWizard } from './create-bounty-wizard';

interface CreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
}

export function CreateBountyModal(props: CreateBountyModalProps) {
  return <CreateBountyWizard {...props} />;
}
