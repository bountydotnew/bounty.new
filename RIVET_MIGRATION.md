# Rivet Notifications Migration

This document describes the migration from polling-based notifications to Rivet Actors for real-time notifications.

## Overview

The notification system has been migrated from a polling solution (API requests every 30 seconds) to Rivet Actors, which provide real-time event-driven notifications.

## What Changed

### 1. Added Rivet Dependencies
- `rivetkit` package installed in root and web app

### 2. Created Rivet Actor for Notifications
- **Location**: `packages/api/src/rivet/notifications-actor.ts`
- **Registry**: `packages/api/src/rivet/registry.ts`
- Handles subscription, updates, and real-time events

### 3. API Route Handler
- **Location**: `apps/web/src/app/api/rivet/[...all]/route.ts`
- Handles all Rivet actor communication
- Configured with `maxDuration = 300` for long-running connections

### 4. Rivet Client
- **Location**: `apps/web/src/lib/rivet-client.ts`
- Singleton client for connecting to Rivet actors

### 5. New Realtime Hook
- **Location**: `apps/web/src/hooks/use-notifications-realtime.ts`
- Replaces the polling-based `useNotifications` hook
- Uses Rivet events for real-time updates
- Maintains same API as old hook for easy migration

### 6. Updated Components
- `apps/web/src/components/notifications/notifications-dropdown.tsx` now uses the realtime hook

### 7. Environment Variables
- Added `NEXT_PUBLIC_RIVET_ENDPOINT` (optional) to `packages/env/src/client.ts`
- Defaults to `/api/rivet` if not set

## How It Works

1. **Client Connection**: When a user opens the app, the `useNotificationsRealtime` hook:
   - Creates an actor instance for that user
   - Subscribes to notification events
   - Receives initial notification data

2. **Real-time Updates**: The actor emits events:
   - `notifications`: Full list of notifications
   - `unreadCount`: Current unread count
   - `newNotification`: When a new notification is created
   - `notificationMarkedRead`: When a notification is marked as read

3. **Server-Side Triggering**: When a notification is created on the server:
   - The notification is saved to the database via tRPC
   - Connected clients automatically receive updates through their actor subscriptions
   - The actor fetches fresh data from the database

## Benefits

- **Real-time**: Notifications appear instantly without polling
- **Reduced Load**: No constant polling reduces server load
- **Better UX**: Users see notifications immediately
- **Hosted on Vercel**: Works seamlessly with Vercel deployments
- **Scalable**: Rivet actors handle state and connections efficiently

## Deployment Notes

- The Rivet endpoint is hosted at `/api/rivet` on your domain
- No additional infrastructure required (runs on Vercel)
- Long-running connections are supported via `maxDuration = 300`
- Falls back gracefully if Rivet is unavailable

## Future Improvements

1. **Broadcast Support**: Add server-side broadcasting when notifications are created
2. **Presence**: Show online users
3. **Typing Indicators**: For comments/messages
4. **Optimistic Updates**: Already partially implemented

## Migration Path

To use the new realtime notifications:

1. Import the new hook:
   ```typescript
   import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
   ```

2. Replace `useNotifications()` with `useNotificationsRealtime()`:
   ```typescript
   const { notifications, unreadCount, markAsRead } = useNotificationsRealtime();
   ```

The API is identical, so no other changes are needed!

## Rollback

If you need to rollback to polling:

1. Revert `apps/web/src/components/notifications/notifications-dropdown.tsx`:
   ```typescript
   import { useNotifications } from '@bounty/ui/hooks/use-notifications';
   // ...
   const { ... } = useNotifications();
   ```

2. The old hook is still available in `packages/ui/src/hooks/use-notifications.ts`
