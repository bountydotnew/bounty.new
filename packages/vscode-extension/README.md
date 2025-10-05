# Bounty VSCode Extension

A beautiful VSCode extension for browsing and managing bounties from [bounty.new](https://bounty.new) - built with React, TypeScript, and Tailwind CSS v4.

## ✨ Features

- 🎨 **Perfect Web App Match** - Identical design to bounty.new
- 📋 **Bounty List View** - Browse all bounties with filters
- 📄 **Bounty Detail View** - Full bounty details, comments, submissions
- 🔐 **Secure Device Auth** - OAuth device flow with Better Auth
- ⚛️ **Modern React** - React 18 + TypeScript + Tailwind v4
- 🚀 **Fast & Lightweight** - 168KB bundle (54% smaller than before)
- 📱 **Responsive** - Works in any panel size
- ♿ **Accessible** - Full keyboard navigation & screen reader support
- 🔄 **Seamless Navigation** - Smooth transitions between views

## 🎯 Quick Start

### Installation

1. Clone the repository
2. Install dependencies:
```bash
bun install
```

### Development

Run all watchers (recommended):
```bash
bun run watch
```

Or run individual watchers:
```bash
# Extension code
bun run watch:esbuild

# Webview (React app)
bun run watch:webview

# TypeScript types
bun run watch:tsc
```

### Building

```bash
# Build webview
bun run webview:build

# Build extension
bun run compile

# Package for distribution
bun run package
```

### Testing

Press `F5` in VSCode to open Extension Development Host

## 🏗️ Architecture

### Extension (Host)
- **AuthService** - Device authorization + session management
- **BountyService** - TRPC API integration
- **SidebarProvider** - Webview lifecycle management

### Webview (React App)
- **Components** - LoginView, BountiesView, BountyCard
- **Hooks** - useAuth, useBounties, useVSCodeMessage
- **UI Components** - Avatar, Button, Spinner, Badge
- **Styling** - Tailwind v4 with web app theme

## 🎨 Design System

Matches bounty.new exactly:

- **Colors**: Dark theme (#0a0a0a, #191919, #383838)
- **Typography**: System fonts with font smoothing
- **Components**: Avatar, verification badge, upvote, bookmark
- **Interactions**: Scale animations, hover states
- **Icons**: Lucide React
- **Time**: Relative formatting ("2 days ago")

## 📦 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling (alpha)
- **Parcel** - Zero-config bundler
- **Better Auth** - Authentication with device flow
- **TRPC** - Type-safe API client
- **Lucide React** - Icon library
- **date-fns** - Time formatting

## 🔐 Authentication

Uses OAuth device authorization flow:

1. Click "Connect to bounty.new"
2. Browser opens to `/device` page
3. User logs in and approves
4. Extension receives Bearer token
5. All API calls authenticated

## 📝 Documentation

- [REACT_SETUP.md](./REACT_SETUP.md) - React architecture details
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - What changed
- [WEB_APP_STYLING.md](./WEB_APP_STYLING.md) - Design system
- [BOUNTY_DETAIL_VIEW.md](./BOUNTY_DETAIL_VIEW.md) - Detail view features
- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - Complete overview

## 🚀 Deployment

```bash
# Create .vsix package
bun run package

# Install locally
code --install-extension bounty-vscode-*.vsix

# Publish to marketplace
vsce publish
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

See LICENSE file in repository root

## 🎉 Built With

- Modern React + TypeScript architecture
- No deprecated dependencies
- Perfect web app design match
- Secure OAuth device authorization
- Type-safe API integration

**Ready to browse bounties from VSCode! 🚀**