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
  TITLE: 'Beta Application',
  DESCRIPTION:
    'Get started by filling in the information below to apply for beta testing.',
  BETA_PHASE_MESSAGE:
    "This feature hasn't been enabled yet. We're currently in beta testing phase.",
  BUTTON_LABELS: {
    FILL_APPLICATION: 'Fill application form',
    APPLICATION_SUBMITTED: 'Application Submitted',
    APPLICATION_DENIED: 'Application Denied',
  },
} as const;
