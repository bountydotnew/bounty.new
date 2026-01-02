// Route segment config to prevent static generation
export const dynamic = 'force-dynamic';

export default function DiscordLinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
