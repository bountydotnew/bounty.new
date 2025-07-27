import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { trpcServer } from "@/lib/trpc-server";

export const metadata: Metadata = {
  title: "Admin - bounty.new",
  description: "Admin dashboard for bounty.new",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await authClient.getSession();

//   if (!session?.user) {
//     redirect("/login?callback=/admin");
//   }

//   const user = await trpcServer.user.getMe.query();
  
//   if (!user || user.role !== "admin") {
//     redirect("/dashboard");
//   }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage beta applications and users</p>
        </div>
        {children}
      </div>
    </div>
  );
} 