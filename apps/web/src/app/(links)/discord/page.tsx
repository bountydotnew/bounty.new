import { redirect } from 'next/navigation';

export const metadata = {
  title: 'bounty.new - Discord',
  description: 'Join our Discord server',
  icons: {
    icon: '/favicon/favicon_dark.png',
    apple: '/favicon/favicon_dark.png',
  },
};
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

export default function DiscordPage() {
  redirect(DISCORD_URL || 'https://discord.gg/mw5asFzwA6');
}
