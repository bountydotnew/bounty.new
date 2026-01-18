# bounty.new Discord Bot

Discord bot for bounty.new platform integration.

## Quick Start

**Prerequisites**

- Bun v1.0+
- PostgreSQL v14+ (shared database with web app)
- Node.js v18+
- Discord Bot Application ([Discord Developer Portal](https://discord.com/developers/applications))

**Setup**

```bash
# Clone the repository
git clone https://github.com/bountydotnew/discord-bot.git
cd discord-bot

# Install dependencies (packages install automatically from GitHub Packages)
bun install

# Copy environment template and fill in your values
cp .env.example .env

# Configure environment variables (see .env.example)
# Important: BETTER_AUTH_SECRET must match the web app's value

# Start the bot
bun dev
```

**Environment Variables**

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string (same as web app)
- `DISCORD_BOT_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_CLIENT_ID` - Discord application client ID
- `DISCORD_CLIENT_SECRET` - Discord application client secret
- `BETTER_AUTH_URL` - URL of the web app (e.g., `http://localhost:3000`)
- `BETTER_AUTH_SECRET` - Must match the web app's `BETTER_AUTH_SECRET`

**Discord Bot Setup**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to `DISCORD_BOT_TOKEN`
5. Copy the application ID to `DISCORD_CLIENT_ID`
6. Copy the client secret to `DISCORD_CLIENT_SECRET`
7. Enable required intents:
   - Server Members Intent (if needed)
   - Message Content Intent (required for reading messages)

**Packages**

All `@bountydotnew/*` packages are automatically installed from GitHub Packages. No additional setup needed!

## Development

```bash
# Run in development mode (with watch)
bun dev

# Run once
bun start

# Type check
bun typecheck
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request
