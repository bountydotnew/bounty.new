export const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

// sidebar
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
// const SIDEBAR_WIDTH_MOBILE = "18rem"
export const SIDEBAR_WIDTH_ICON = "4rem";
export const SIDEBAR_WIDTH_ICON_HOVER = "4.3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";
// Dashboard constants
export const PAGINATION_LIMITS = {
  ALL_BOUNTIES: 10,
  MY_BOUNTIES: 5,
  MY_BOUNTIES_SIDEBAR: 3,
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
} as const;

export const LOADING_SKELETON_COUNTS = {
  BOUNTIES: 5,
  MY_BOUNTIES: 3,
} as const;

export const BETA_APPLICATION_MESSAGES = {
  TITLE: "Beta Application",
  DESCRIPTION:
    "Get started by filling in the information below to apply for beta testing.",
  BETA_PHASE_MESSAGE:
    "This feature hasn't been enabled yet. We're currently in beta testing phase.",
  BUTTON_LABELS: {
    FILL_APPLICATION: "Fill application form",
    APPLICATION_SUBMITTED: "Application Submitted",
    APPLICATION_DENIED: "Application Denied",
  },
} as const;

const SOCIALS = {
  GITHUB: "https://github.com/bountydotnew/bounty.new",
};

export const LINKS = {
  SOCIALS,
  HOME: "/",
  DASHBOARD: "/dashboard",
  ACCOUNT: "/settings",
  SETTINGS: "/settings",
  LOGIN: "/login",
  BOOKMARKS: "/bookmarks",
  CONTRIBUTORS: "/contributors",
  BLOG: "/blog",
  PRICING: "/pricing",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  CONTACT: "/contact",
  BOUNTY: {
    VIEW: "/bounty",
  },
  BOUNTIES: "/bounties",
};
