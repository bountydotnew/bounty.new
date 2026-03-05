'use client';

export { useWebHaptics as useHaptics } from 'web-haptics/react';

export type HapticTriggerType =
  | 'success'
  | 'warning'
  | 'error'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection';
