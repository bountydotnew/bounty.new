export interface BetterAuthUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image?: string;
  // Role: 'user' | 'admin' | 'early_access'
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
  EarlyAccessRequired: 'early_access_required',
  EmailUnverified: 'email_unverified',
  Banned: 'banned',
  PlanRequired: 'plan_required',
  Forbidden: 'forbidden',
} as const;
export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];
