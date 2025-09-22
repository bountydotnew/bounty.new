import type { Metadata } from 'next';
import { Sidebar } from '@/components/dual-sidebar';

export const metadata: Metadata = {
  title: 'Admin - bounty.new',
  description: 'Admin dashboard for bounty.new',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar admin={true}>
      <div className="min-h-screen bg-[#111110] text-white">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
    </Sidebar>
  );
}
