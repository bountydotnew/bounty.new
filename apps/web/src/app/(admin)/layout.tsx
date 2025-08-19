import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - bounty.new",
  description: "Admin dashboard for bounty.new",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage beta applications and users
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
