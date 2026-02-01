import { AccountSettings } from '@/components/settings/account-settings';

export default function AccountSettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <header>
        <h1 className="text-2xl font-medium text-foreground">Account</h1>
        <p className="text-base text-text-secondary">
          Tweak your account settings and preferences to your liking
        </p>
      </header>
      <AccountSettings />
    </div>
  );
}
