import { SecuritySettings } from '@/components/settings/security-settings';

export default function SecuritySettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Security</h1>
        <p className="text-muted-foreground">
          Manage your account security and authentication settings.
        </p>
      </header>
      <main>
        <SecuritySettings />
      </main>
    </div>
  );
}
