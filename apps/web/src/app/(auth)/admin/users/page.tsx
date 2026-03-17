import type { Metadata } from 'next';
import { AdminUsers } from '@/components/admin/admin-users';

export const metadata: Metadata = {
  title: 'Admin - Users',
  description: 'Manage users and send invite codes',
};

export default function AdminUsersPage() {
  return <AdminUsers />;
}
