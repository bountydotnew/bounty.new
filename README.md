# bounty.new

A Modern Bounty Platform for the Future of Incentivized Work

## What is bounty.new?

bounty.new is an open-source bounty platform that connects creators, developers, and organizations with skilled contributors through incentivized tasks and challenges. Built with modern web technologies, it provides a seamless experience for posting bounties, managing submissions, and rewarding quality work.

## Why bounty.new?

Traditional freelancing platforms are often complex, expensive, and lack transparency. bounty.new is different:

- **Open Source** - Fully transparent and community-driven development
- **Type-Safe** - Built with TypeScript for reliability and developer experience  
- **Modern Stack** - Leverages cutting-edge web technologies for performance
- **Fair Rewards** - Transparent bounty system with clear payout structures
- **Developer First** - Built by developers, for developers and creators
- **Self-Hostable** - Deploy your own instance with full control
- **Fast Setup** - Get running locally in minutes with minimal configuration

## Tech Stack

bounty.new is built with modern and reliable technologies:

- **Frontend**: Next.js, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, tRPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with GitHub OAuth support
- **Runtime**: Bun for fast package management and execution
- **Monorepo**: Turborepo for optimized builds and development

## Getting Started

### Prerequisites

Before running bounty.new, ensure you have:

- [Bun](https://bun.sh) (v1.0 or higher)
- [PostgreSQL](https://postgresql.org) (v14 or higher)
- [Node.js](https://nodejs.org) (v18 or higher)

### Quick Start

1. **Clone and Install**

   ```bash
   git clone https://github.com/ripgrim/bounty.new.git
   cd bounty.new
   
   # Install dependencies
   bun install
   ```

2. **Database Setup**

   Set up your PostgreSQL database and update the connection string in `apps/server/.env`:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bounty_new"
   ```

   Apply the database schema:

   ```bash
   bun db:push
   ```

3. **Environment Configuration**

   Copy the example environment files and configure your settings:

   ```bash
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.example apps/web/.env
   ```

   Update the environment variables with your configuration.

4. **Start Development**

   ```bash
   bun dev
   ```

5. **Open in Browser**

   - Web Application: [http://localhost:3001](http://localhost:3001)
   - API Server: [http://localhost:3000](http://localhost:3000)

## Project Structure

```
bounty.new/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   └── server/      # Backend API (Next.js, tRPC)
├── packages/        # Shared packages and utilities
└── docs/           # Documentation
```

## Available Scripts

- `bun dev` - Start all applications in development mode
- `bun build` - Build all applications for production
- `bun dev:web` - Start only the web application
- `bun dev:server` - Start only the API server
- `bun check-types` - Type check all applications
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Drizzle Studio for database management
- `bun db:generate` - Generate new database migrations

## Environment Variables

### Server Configuration

Required environment variables for `apps/server/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bounty_new"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Application
NODE_ENV="development"
```

### Web Configuration

Required environment variables for `apps/web/.env`:

```env
# API Connection
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Application
NODE_ENV="development"
```

## Contributing

We welcome contributions to bounty.new! Please read our contributing guidelines before submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all checks pass
6. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

- Check the [documentation](docs/)
- Open an [issue](https://github.com/ripgrim/bounty.new/issues)
- Join our community discussions

---

Built with ❤️ for the open source community
