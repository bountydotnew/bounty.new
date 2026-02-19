const MOBILE_REGEX =
	/Android(?!.*Tablet)|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
const TABLET_REGEX = /iPad|Android.*Tablet|Kindle|Silk|PlayBook/i;

export function isMobileDevice(userAgent: string): boolean {
	return MOBILE_REGEX.test(userAgent);
}

export function isTabletDevice(userAgent: string): boolean {
	return TABLET_REGEX.test(userAgent);
}

export function getDeviceType(
	userAgent: string,
): "mobile" | "tablet" | "desktop" {
	if (isTabletDevice(userAgent)) {
		return "tablet";
	}
	if (isMobileDevice(userAgent)) {
		return "mobile";
	}
	return "desktop";
}
