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
  session?: BetterAuthSessionData & {
    impersonatedBy?: string;
  };
}