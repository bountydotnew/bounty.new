export function isMobileDevice(userAgent: string): boolean {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

export function getDeviceType(userAgent: string): 'mobile' | 'desktop' {
  return isMobileDevice(userAgent) ? 'mobile' : 'desktop';
} 