export function isMobileDevice(userAgent: string): boolean {
  const mobileRegex = /Android(?!.*Tablet)|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  return mobileRegex.test(userAgent);
}

export function isTabletDevice(userAgent: string): boolean {
  const tabletRegex = /iPad|Android.*Tablet|Kindle|Silk|PlayBook/i;
  return tabletRegex.test(userAgent);
}

export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (isTabletDevice(userAgent)) return 'tablet';
  if (isMobileDevice(userAgent)) return 'mobile';
  return 'desktop';
} 