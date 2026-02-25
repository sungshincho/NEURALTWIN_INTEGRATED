import type { Enums } from './database.helpers';

// DB Enum 기반 역할
export type AppRole = Enums<'app_role'>;
// = 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER' | 'NEURALTWIN_ADMIN' | 'NEURALTWIN_MASTER' | 'ORG_HQ' | 'ORG_STORE' | 'ORG_VIEWER'

export type ChatChannel = Enums<'chat_channel'>;
// = 'website' | 'os_app'

// 프론트엔드 레거시 호환
export type UserRole = 'admin' | 'manager' | 'viewer';

export type LicenseType = 'free' | 'pro' | 'enterprise';

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  orgId: string | null;
  role: AppRole | null;
  license: LicenseType | null;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
  app_metadata?: { provider?: string; providers?: string[] };
  user_metadata?: { full_name?: string; avatar_url?: string };
}
