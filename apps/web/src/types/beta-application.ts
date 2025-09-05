export type BetaApplication = {
  id: string;
  name: string;
  twitter: string;
  projectName: string;
  projectLink: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};
