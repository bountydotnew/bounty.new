# @bounty/feedback

feedback widget with element selection, screenshots, and server-side routing.

## install

workspace package — already available via `bun install` at the repo root.

```
import { FeedbackProvider, FeedbackForm, ... } from '@bounty/feedback'
import { createFeedbackHandler } from '@bounty/feedback/server'
```

## quick start

### 1. add the provider

wrap your app (or a layout) in `FeedbackProvider`. one instance, as high as needed.

```tsx
import { FeedbackProvider, FeedbackOverlay } from '@bounty/feedback';

export default function Layout({ children }) {
  return (
    <FeedbackProvider
      config={{
        metadata: { appVersion: '1.0.0' },
        ui: {
          title: 'Report an Issue',
          placeholder: 'Found a bug? Let us know...',
        },
      }}
    >
      <FeedbackOverlay />
      {/* your dialog component — see step 2 */}
      {children}
    </FeedbackProvider>
  );
}
```

`FeedbackOverlay` renders the element picker (crosshair mode). it portals to `document.body` and only shows when selection is active.

### 2. render the form

`FeedbackForm` is headless — it renders fields and buttons, no dialog wrapper. put it inside your own dialog:

```tsx
import { FeedbackForm, useFeedback } from '@bounty/feedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bounty/ui/components/dialog';

export function FeedbackDialog() {
  const { isOpen, close, config } = useFeedback();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.ui?.title ?? 'Send Feedback'}</DialogTitle>
        </DialogHeader>
        <FeedbackForm />
      </DialogContent>
    </Dialog>
  );
}
```

if you don't have a dialog component, use `FeedbackModal` instead — it wraps `FeedbackForm` in a native `<dialog>` element.

### 3. trigger it

option a — use `useFeedback()` directly:

```tsx
const { startSelection, open } = useFeedback();

// element picker flow: startSelection() → user clicks element → modal opens
<button onClick={() => startSelection()}>Send Feedback</button>

// direct flow: open() → modal opens immediately
<button onClick={() => open()}>Quick Feedback</button>
```

option b — use `FeedbackTrigger` to wrap any element:

```tsx
import { FeedbackTrigger } from '@bounty/feedback';

<FeedbackTrigger>
  <button>Send Feedback</button>
</FeedbackTrigger>

<FeedbackTrigger mode="direct">
  <button>Quick Feedback</button>
</FeedbackTrigger>
```

option c — use `FeedbackButton` for a floating button:

```tsx
import { FeedbackButton } from '@bounty/feedback';

<FeedbackButton position="bottom-right" />
```

### 4. add the api route

create `app/api/feedback/route.ts`:

```ts
import { createFeedbackHandler } from '@bounty/feedback/server';

export const POST = createFeedbackHandler({
  adapters: {},
  channels: [],
  onFeedback: async (data) => {
    // data.comment, data.route, data.userAgent, data.element, data.screenshot, etc.
    // send to discord, slack, db, whatever
    console.log('[feedback]', data.comment);
  },
});
```

the handler parses the multipart form data and calls your `onFeedback` callback with a typed `FeedbackData` object.

## provider props

```ts
<FeedbackProvider
  endpoint="/api/feedback"        // POST endpoint (default: /api/feedback)
  config={{
    metadata: Record<string, string>,  // attached to every submission
    ui: {
      title: string,              // dialog title
      description: string,        // dialog description
      placeholder: string,        // textarea placeholder
      submitLabel: string,        // submit button text (default: "Send Feedback")
      cancelLabel: string,        // cancel button text (default: "Cancel")
      zIndex: number,             // overlay z-index
    },
    onSubmit: (data) => void,     // called after successful submission
    onOpen: () => void,           // called when modal opens
    onClose: () => void,          // called when modal closes
  }}
/>
```

## context api

```ts
const {
  isOpen,           // modal is visible
  isSelecting,      // element picker is active
  elementContext,   // selected element info (ReactGrabElementContext | null)
  open,             // open modal directly
  close,            // close modal
  startSelection,   // enter element picker mode
  cancelSelection,  // exit element picker without opening modal
  selectElement,    // set element context and open modal
  config,           // current config
} = useFeedback();
```

## server handler

`createFeedbackHandler` returns a `POST` handler compatible with next.js app router route handlers.

```ts
createFeedbackHandler({
  adapters: {},                      // chat sdk adapters (can be empty)
  channels: [],                      // chat sdk channel ids (can be empty)
  onFeedback: async (data) => {},    // your callback — this is where you send the data
  formatTitle: (data) => string,     // override card title
  formatBody: (data) => string,      // override card body
  botName: string,                   // chat sdk bot name
})
```

### FeedbackData shape

```ts
{
  comment: string
  route: string
  userAgent: string
  prompt?: string                    // user's suggested fix
  element?: {
    componentName: string | null
    selector: string | null
    htmlPreview?: string
    stack: Array<{
      functionName: string | null
      fileName: string | null
      lineNumber: number | null
      columnNumber: number | null
    }>
  }
  metadata?: Record<string, string>
  hasScreenshot: boolean
  screenshot?: File | null
}
```

## components

| component | what it does |
|---|---|
| `FeedbackProvider` | context provider. wrap your app in it. |
| `FeedbackForm` | headless form (comment, suggested fix, screenshot toggle). put inside your own dialog. |
| `FeedbackModal` | `FeedbackForm` inside a native `<dialog>`. fallback if you don't have a dialog component. |
| `FeedbackOverlay` | element picker overlay. portals to body, shows on `startSelection()`. |
| `FeedbackButton` | floating button that calls `open()`. position: `bottom-right`, `bottom-left`, `top-right`, `top-left`. |
| `FeedbackTrigger` | wraps any child element to trigger feedback on click. `mode="select"` (default) or `mode="direct"`. |

## features

- **element selection**: user clicks an element, the package resolves its react component name, css selector, source file location, and component stack via `react-grab` and `bippy`.
- **screenshots**: captures the page via `html2canvas-pro`. removes dialogs/overlays from the capture, blurs elements with `data-privacy="masked"`, and highlights the selected element.
- **privacy masking**: add `data-privacy="masked"` to any element to blur it in screenshots.
- **ignore elements**: add `data-feedback-ignore` to exclude elements from the picker.

## deps

- `react-grab` — element context resolution
- `bippy` — react fiber traversal for component names
- `html2canvas-pro` — screenshot capture
- `chat`, `@chat-adapter/state-memory` — chat sdk (used by server handler)
