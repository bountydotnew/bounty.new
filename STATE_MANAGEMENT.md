# State Management Guidelines

This document outlines the state management guidelines for the bounty.new codebase.

## Overview

We use a hybrid approach combining React's built-in state management with Zustand for global state. This provides the right balance between simplicity and scalability.

## 1. Page-Level State (useState)

**Use for:** Local, UI-specific data within a component.

**Examples:**
- Form input values
- Modal open/closed states
- Loading states for specific operations
- UI toggles (e.g., showing/hiding sections)

**Implementation:**

```tsx
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  return (
    // Component JSX
  );
}
```

## 2. Global-Level State (Zustand)

**Use for:** Shared, app-wide data that needs to be accessed across multiple components.

**Examples:**
- User profile & account information
- Authentication status
- Theme or locale preferences
- Global app settings
- Features like confetti celebrations

**Benefits:**
- Built-in middleware support (devtools, persist, etc.)
- No unnecessary re-renders
- Stable references
- Easy to test
- TypeScript-friendly

**Implementation:**

```tsx
// stores/my-store.ts
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    { name: 'my-store' }
  )
);
```

**Usage:**

```tsx
import { useMyStore } from '@/stores/my-store';

export function Counter() {
  const { count, increment } = useMyStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## 3. Combine Context + Zustand (Scoped Stores)

**Use for:** When you need multiple independent instances of the same store logic, scoped to different parts of the component tree.

**Example Use Case:** A map component that needs its own position state, with multiple map instances on the same page.

**Implementation:**

```tsx
// stores/create-map-store.ts
import { createStore } from 'zustand';

interface MapState {
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}

export const createMapStore = () =>
  createStore<MapState>()((set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }));

// context/map-context.tsx
'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { createMapStore } from '@/stores/create-map-store';
import { useStore } from 'zustand';

type MapStore = ReturnType<typeof createMapStore>;
const MapContext = createContext<MapStore | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<MapStore>();
  if (!storeRef.current) {
    storeRef.current = createMapStore();
  }

  return (
    <MapContext.Provider value={storeRef.current}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapStore<T>(selector: (state: MapState) => T): T {
  const store = useContext(MapContext);
  if (!store) {
    throw new Error('useMapStore must be used within MapProvider');
  }
  return useStore(store, selector);
}
```

**Benefits:**
- Each provider instance gets its own store
- Unmounting the provider resets the store
- Still gets all benefits of Zustand (devtools, middleware, etc.)

## 4. When to Use Context Alone

**Use for:** True dependency injection within a small component subtree where you need to pass down configuration or instances.

**DO NOT use Context for:**
- Full global state management (use Zustand instead)
- State that changes frequently
- State that needs to be accessed across many component boundaries

**Example (Acceptable Use):**

```tsx
// For injecting configuration or instances
const ThemeConfigContext = createContext<ThemeConfig | null>(null);

export function ThemeConfigProvider({ config, children }: Props) {
  return (
    <ThemeConfigContext.Provider value={config}>
      {children}
    </ThemeConfigContext.Provider>
  );
}
```

## 5. Avoid External Render Triggers

**Rule:** Keep all state inside React boundaries (useState, Zustand, or Context).

**Why:**
- Ensures React can properly track dependencies
- Makes debugging easier
- Improves maintainability as the codebase grows
- Prevents unexpected re-renders

**Don't do this:**

```tsx
// ❌ External state outside React
let globalCounter = 0;

export function Counter() {
  const [, forceUpdate] = useState({});

  return (
    <button onClick={() => {
      globalCounter++;
      forceUpdate({}); // Manual re-render trigger
    }}>
      Count: {globalCounter}
    </button>
  );
}
```

**Do this instead:**

```tsx
// ✅ State inside React boundaries
import { useCounterStore } from '@/stores/counter-store';

export function Counter() {
  const { count, increment } = useCounterStore();

  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
```

## Implementation Examples in Codebase

### Confetti Store (Global State)

Located at `apps/web/src/stores/confetti-store.ts`, this demonstrates a simple global state pattern:

```tsx
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ConfettiState {
  shouldCelebrate: boolean;
  celebrate: () => void;
  reset: () => void;
}

export const useConfettiStore = create<ConfettiState>()(
  devtools(
    (set) => ({
      shouldCelebrate: false,
      celebrate: () => set({ shouldCelebrate: true }),
      reset: () => set({ shouldCelebrate: false }),
    }),
    { name: 'confetti-store' }
  )
);
```

The confetti provider (`apps/web/src/context/confetti-context.tsx`) then uses this store and manages the auto-reset timer:

```tsx
export function ConfettiProvider({ children }: ConfettiProviderProps) {
  const { shouldCelebrate, reset } = useConfettiStore();
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (shouldCelebrate) {
      const timer = setTimeout(() => reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [shouldCelebrate, reset]);

  return (
    <>
      {children}
      {shouldCelebrate && width && height && (
        <Confetti
          // ... confetti props
        />
      )}
    </>
  );
}
```

## Migration Guide

### From Context to Zustand

1. Create a new store in `apps/web/src/stores/`
2. Move state and actions from Context to the store
3. Replace Context provider with a simple wrapper if needed
4. Update all consumers to use the store hook instead of Context

### From useState to Zustand

Only migrate if:
- State needs to be shared across multiple components
- State is causing prop drilling issues
- State represents global application state

Otherwise, keep it as local state with useState.

## Best Practices

1. **Store Organization:** Create stores in `apps/web/src/stores/` with descriptive names (e.g., `user-store.ts`, `theme-store.ts`)

2. **Use Devtools:** Always wrap stores with the `devtools` middleware for easier debugging

3. **Selective Subscriptions:** Only select the state you need to avoid unnecessary re-renders

   ```tsx
   // ✅ Good: Only subscribes to count
   const count = useMyStore((state) => state.count);

   // ❌ Bad: Subscribes to entire store
   const { count } = useMyStore();
   ```

4. **TypeScript:** Always define proper types for your stores

5. **Actions over Direct State Manipulation:** Define actions in the store rather than exposing `setState`

6. **Testing:** Zustand stores are easy to test in isolation

## Decision Tree

```
Is this state local to a single component and its children?
├─ Yes → Use useState
└─ No → Does it need to be shared across the app?
    ├─ Yes → Use Zustand (Global Store)
    └─ No → Do you need multiple independent instances?
        ├─ Yes → Use Context + Zustand (Scoped Store)
        └─ No → Use useState or lift state up
```

## Additional Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React State Management](https://react.dev/learn/managing-state)
- [When to use Context](https://react.dev/learn/passing-data-deeply-with-context)
