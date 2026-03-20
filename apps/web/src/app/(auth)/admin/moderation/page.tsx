import type { Metadata } from 'next';
import { AdminModeration } from '@/components/admin/admin-moderation';

export const metadata: Metadata = {
  title: 'Admin - Moderation',
  description: 'Review reports and manage hidden content',
};

export default function AdminModerationPage() {
  return <AdminModeration />;
}
