export interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  hasAccess: boolean;
  betaAccessStatus: 'none' | 'pending' | 'approved' | 'denied';
  accessStage: 'none' | 'alpha' | 'beta' | 'production';
  role: string;
  banned: boolean;
  banReason?: string;
  banExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSessionData {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
  impersonatedBy?: string;
}

export interface BetterAuthSession {
  user: BetterAuthUser;
  session: BetterAuthSessionData;
}

export interface ExtendedAuthSession extends BetterAuthSession {
  impersonatedBy?: string;
  session: BetterAuthSessionData & {
    impersonatedBy?: string;
  };
}

// Reason codes used to classify auth/authorization client UX
export const ReasonCode = {
  Unauthenticated: 'unauthenticated',
  BetaRequired: 'beta_required',
  EmailUnverified: 'email_unverified',
  Banned: 'banned',
  PlanRequired: 'plan_required',
  Forbidden: 'forbidden',
} as const;
export type ReasonCode = typeof ReasonCode[keyof typeof ReasonCode];

// Higher-level access requirements for gating UI/routes
export const AccessRequirement = {
  AnyAuthenticated: 'any_authenticated',
  BetaAccess: 'beta_access',
  EmailVerified: 'email_verified',
  NotBanned: 'not_banned',
} as const;
export type AccessRequirement = typeof AccessRequirement[keyof typeof AccessRequirement];

export interface AccessProfile {
  stage: BetterAuthUser['accessStage'];
  hasAccess: boolean;
  betaAccessStatus: BetterAuthUser['betaAccessStatus'];
  emailVerified: boolean;
  banned: boolean;
  featureFlags: string[];
}
