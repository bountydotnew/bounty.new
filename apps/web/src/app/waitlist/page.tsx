import { redirect } from 'next/navigation';

export default function WaitlistPage() {
  redirect('/?waitlist=true');
}
