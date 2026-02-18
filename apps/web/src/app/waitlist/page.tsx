import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Waitlist',
  description: 'Join the waitlist to get early access to bounty.new.',
};

export default function WaitlistPage() {
  redirect('/?waitlist=true');
}
