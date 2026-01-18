# Notification Toasts

Composable notification toast components for peer-to-peer notifications.

## Components

### Base Components

- **`NotificationToast`** - Base component for all notification toasts
- **`BountyLikedToast`** - Toast for when someone likes a bounty
- **`BountyCommentToast`** - Toast for when someone comments on a bounty
- **`BountyReportedToast`** - Toast for when someone reports a bounty

### Helper Functions

- **`showNotificationToast(type, data, options)`** - Automatically shows the correct toast based on notification type

## Usage Examples

### Basic Usage

```tsx
import { showBountyLikedToast } from '@bounty/ui/components/toast';

showBountyLikedToast({
  user: {
    name: 'John Doe',
    image: 'https://example.com/avatar.jpg',
  },
  timestamp: new Date(),
  onMarkAsRead: () => {
    // Mark notification as read
  },
});
```

### Using the Helper Function

```tsx
import { showNotificationToast } from '@bounty/ui/components/toast';

showNotificationToast('bounty_comment', {
  user: {
    name: 'Jane Smith',
    image: null,
  },
  timestamp: new Date(),
  onMarkAsRead: () => markAsRead(notificationId),
});
```

### Custom Toast

```tsx
import { NotificationToast } from '@bounty/ui/components/toast';
import { toast } from 'sonner';
import { CustomIcon } from 'lucide-react';

toast.custom((id) => (
  <NotificationToast
    id={id}
    user={{ name: 'User', image: null }}
    message="Custom notification message"
    timestamp={new Date()}
    actionIcon={<CustomIcon className="size-2.5" />}
    onDismiss={() => toast.dismiss(id)}
    onMarkAsRead={() => {
      // Handle mark as read
      toast.dismiss(id);
    }}
  />
));
```

## Notification Types

Supported notification types:
- `bounty_comment` - Shows comment toast
- `bounty_liked` / `bounty_voted` - Shows liked toast
- `bounty_reported` - Shows reported toast
- Any other type - Shows generic notification toast
