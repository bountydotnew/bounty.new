'use client';

import { getDeviceType } from '@bounty/ui/lib/device-detection';
import { createContext, type ReactNode, useContext } from 'react';

interface DeviceContextType {
  isMobile: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
}

interface DeviceProviderProps {
  userAgent: string;
  children: ReactNode;
}

export function DeviceProvider({ userAgent, children }: DeviceProviderProps) {
  const deviceType = getDeviceType(userAgent);
  const isMobile = deviceType === 'mobile' || deviceType === 'tablet';

  return (
    <DeviceContext.Provider value={{ isMobile, deviceType }}>
      {children}
    </DeviceContext.Provider>
  );
}
