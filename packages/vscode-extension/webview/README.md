# Bounty VSCode Extension Webview

React + TypeScript + Tailwind v4 webview for the Bounty VSCode extension.

## Structure

```
webview/
├── src/
│   ├── components/      # React components
│   │   ├── LoginView.tsx
│   │   ├── BountiesView.tsx
│   │   └── BountyCard.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useBounties.ts
│   │   └── use-vscode-message.ts
│   ├── styles/          # Tailwind CSS
│   │   └── index.css
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   └── vscode.ts
│   ├── App.tsx          # Main app component
│   └── index.tsx        # Entry point
├── package.json
├── tsconfig.json
└── .postcssrc           # PostCSS config for Tailwind
```

## Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm start

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling (alpha)
- **Custom VSCode Components** - Native VSCode-styled components using CSS variables
- **Parcel** - Zero-config bundler

## Features

- Full TypeScript support
- Hot module reloading during development
- Tailwind v4 with VSCode theme variables
- Custom VSCode-styled UI components (Button, Spinner, Badge)
- No deprecated dependencies
- Custom hooks for VSCode messaging
- Componentized architecture
- Type-safe communication with extension
- Lightweight bundle (~151KB)
