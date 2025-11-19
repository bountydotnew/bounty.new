# Error Handling Implementation

This document describes the comprehensive error handling system implemented across the bounty.new application.

## Overview

The error handling system follows Next.js best practices and includes:

1. **Client-side error boundaries** for React rendering errors
2. **Server error handling** with Sentry integration
3. **tRPC error handling** with user-friendly messages
4. **Form validation errors** with inline display using Zod
5. **Reusable error UI components**

## Components

### Error UI Components

Located in `packages/ui/src/components/`:

#### ErrorMessage
Inline error message component for form fields.

```tsx
import { ErrorMessage } from '@bounty/ui/components/error-message';

<ErrorMessage message={errors.title?.message} />
```

#### ErrorBanner
Banner component for displaying errors with retry and dismiss options.

```tsx
import { ErrorBanner } from '@bounty/ui/components/error-banner';

<ErrorBanner
  message={errorMessage}
  onRetry={() => retryFunction()}
  onDismiss={() => setError(null)}
/>
```

#### ErrorState
Full error state component for data fetching failures.

```tsx
import { ErrorState } from '@bounty/ui/components/error-state';

<ErrorState
  title="Failed to load data"
  message="Please try again later"
  onRetry={() => refetch()}
/>
```

## Error Boundaries

### Global Error Boundary
Located at `apps/web/src/app/global-error.tsx` - catches errors in the root layout.

### Route-level Error Boundary
Located at `apps/web/src/app/error.tsx` - catches errors within specific routes.

### Dashboard Error Boundary
Located at `apps/web/src/components/dashboard/error-boundary.tsx` - catches errors within the dashboard.

All error boundaries integrate with Sentry for error tracking.

## Sentry Integration

### Configuration Files

- `apps/web/sentry.client.config.ts` - Client-side Sentry configuration
- `apps/web/sentry.server.config.ts` - Server-side Sentry configuration
- `apps/web/sentry.edge.config.ts` - Edge runtime Sentry configuration
- `apps/web/instrumentation.ts` - Instrumentation hook for Sentry

### Environment Variables

Add the following to your `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### Usage

Errors are automatically captured by Sentry in:
- Error boundaries
- tRPC mutations and queries
- Server-side errors

Manual error capture:

```tsx
import * as Sentry from '@sentry/nextjs';

try {
  // Some code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'MyComponent',
    },
  });
}
```

## tRPC Error Handling

### Server-side

Error formatting is configured in `packages/api/src/trpc.ts`. Errors are logged to console in development.

### Client-side

Use the error handler utility in `apps/web/src/utils/trpc-error-handler.ts`:

```tsx
import { handleTRPCError, showTRPCErrorToast } from '@/utils/trpc-error-handler';

// In a mutation
onError: (error) => {
  const errorMessage = handleTRPCError(error, 'Failed to create bounty');
  setError(errorMessage);
}

// Or show a toast
onError: (error) => {
  showTRPCErrorToast(error, 'Failed to create bounty');
}
```

## Form Validation

### Zod Schemas

All form schemas are defined in `packages/ui/src/lib/forms.ts`.

Example:

```tsx
export const createBountySchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  amount: z
    .string()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Incorrect amount.')
    .min(1, 'Amount cannot be empty'),
});
```

### Form Error Helpers

Located in `packages/ui/src/lib/form-errors.ts`:

```tsx
import { getFieldError, hasFieldError, getAllErrors } from '@bounty/ui/lib/form-errors';

// Get error for specific field
const titleError = getFieldError('title', errors);

// Check if field has error
if (hasFieldError('title', errors)) {
  // Handle error
}

// Get all errors
const allErrors = getAllErrors(errors);
```

### Usage in Forms

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@bounty/ui/components/error-message';
import { createBountySchema } from '@bounty/ui/lib/forms';

const form = useForm({
  resolver: zodResolver(createBountySchema),
  defaultValues: { ... },
});

const { control, formState: { errors } } = form;

<Controller
  control={control}
  name="title"
  render={({ field }) => (
    <>
      <Input
        {...field}
        className={errors.title ? 'border-red-500' : ''}
      />
      <ErrorMessage message={errors.title?.message} />
    </>
  )}
/>
```

## Best Practices

### 1. Always Log Errors to Sentry

```tsx
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: {
    feature: 'bounty-creation',
    action: 'submit',
  },
  extra: {
    formData: sanitizedFormData,
  },
});
```

### 2. Show User-Friendly Messages

Don't expose technical error messages to users. Use `handleTRPCError` to convert errors to user-friendly messages.

### 3. Provide Recovery Options

Always include a way for users to recover from errors:
- "Try Again" buttons
- "Go Home" links
- Clear error messages explaining what went wrong

### 4. Use ErrorBanner for Form Submissions

```tsx
const [submitError, setSubmitError] = useState<string | null>(null);

// In mutation
onError: (error) => {
  const errorMessage = handleTRPCError(error);
  setSubmitError(errorMessage);
}

// In form
{submitError && (
  <ErrorBanner
    message={submitError}
    onRetry={() => mutation.mutate(formData)}
    onDismiss={() => setSubmitError(null)}
  />
)}
```

### 5. Clear Errors on Success

```tsx
onSuccess: () => {
  setSubmitError(null);
  // Other success handling
}
```

### 6. Use ErrorState for Data Loading

```tsx
if (query.isError) {
  return (
    <ErrorState
      title="Failed to load bounties"
      message="Please try again or refresh the page"
      onRetry={() => query.refetch()}
    />
  );
}
```

## Testing

To test error handling:

1. **Client-side errors**: Throw an error in a component to test error boundaries
2. **Form validation**: Submit forms with invalid data
3. **tRPC errors**: Test API failures (network errors, auth errors, etc.)
4. **Sentry**: Check Sentry dashboard for captured errors

## Future Improvements

- [ ] Add error rate monitoring
- [ ] Implement error analytics dashboard
- [ ] Add user feedback widget for errors
- [ ] Create error recovery suggestions based on error type
- [ ] Implement retry with exponential backoff for transient errors
