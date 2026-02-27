// Legacy re-export for backward compatibility
// Sonner has been replaced with coss Toast in Base UI

export { ToastProvider as Toaster, toastManager } from './toast';

// The toast function API has changed. Use toastManager.add() instead.
// For backward compatibility, import { toast } from '@/context/toast' in your app.
