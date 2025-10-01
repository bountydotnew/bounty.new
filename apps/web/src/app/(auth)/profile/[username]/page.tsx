import { getServerCustomerState } from '@bounty/auth/server-utils';
import { ProfileClient } from './profile-client';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const { data: customerState } = await getServerCustomerState();

  return <ProfileClient initialCustomerState={customerState} username={username} />;
}
