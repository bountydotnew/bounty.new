import { redirect } from "next/navigation";

export const metadata = {
  title: "bounty.new - Discord",  
  description: "Join our Discord server",
  icons: {
    icon: "/icon.svg",
  },  
};
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

export default function DiscordPage() {
  redirect(DISCORD_URL || "https://discord.gg/mw5asFzwA6");
}