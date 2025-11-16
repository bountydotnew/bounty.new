export const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// sidebar
export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = '302px'; // Match mockup width

export const SIDEBAR_WIDTH_MOBILE = "18rem"
// Icon width: ~20px icon + 3px padding on each side = ~26px, rounded to 1.75rem (28px) for comfortable spacing
export const SIDEBAR_WIDTH_ICON = '3.5rem';
export const SIDEBAR_WIDTH_ICON_HOVER = '3.3rem';
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
