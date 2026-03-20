import type { Metadata } from 'next';
import { AdminEvents } from '@/components/admin/admin-events';

export const metadata: Metadata = {
  title: 'Admin - Events',
  description: 'Recent activity and system events',
};

export default function AdminEventsPage() {
  return <AdminEvents />;
}
