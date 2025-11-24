import { Bell } from 'lucide-react';

export default function NotificationsSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Notifications</h1>
        <p className="text-muted-foreground">
          Configure your notification preferences.
        </p>
      </header>
      <main>
        <div className="rounded-lg border border-border border-dashed bg-card p-6">
          <div className="mb-2 flex items-center gap-2">
            <Bell className="h-5 w-5 text-foreground" />
            <h3 className="font-medium text-foreground">Coming Soon</h3>
          </div>
          <p className="text-foreground text-sm">
            Notification settings will be implemented here. You&apos;ll be able to
            configure email notifications, push notifications, and other
            communication preferences.
          </p>
        </div>
      </main>
    </div>
  );
}
