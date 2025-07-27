import { redirect } from "next/navigation";

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

export default function DiscordPage() {
  redirect(DISCORD_URL || "https://discord.gg/mw5asFzwA6");
}