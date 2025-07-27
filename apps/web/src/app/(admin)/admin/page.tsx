"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Beta Applications
            </CardTitle>
            <CardDescription>
              Review and manage beta access applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/beta-applications">
              <Button className="w-full">View Applications</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waitlist
            </CardTitle>
            <CardDescription>
              View and manage waitlist entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/waitlist">
              <Button className="w-full">View Waitlist</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 