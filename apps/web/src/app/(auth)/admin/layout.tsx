import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@bounty/auth/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-1 shrink-0 flex-col h-full w-full min-h-0 lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
