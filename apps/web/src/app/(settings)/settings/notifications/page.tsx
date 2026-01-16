import { Bell } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 font-bold text-3xl">Notifications</h1>
        <p className="text-muted-foreground">
          Configure your notification preferences.
        </p>
      </header>
      <Card className="rounded-lg border border-border border-dashed bg-card">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Bell className="h-5 w-5 text-foreground" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm">
            Notification settings will be implemented here. You&apos;ll be able
            to configure email notifications, push notifications, and other
            communication preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
