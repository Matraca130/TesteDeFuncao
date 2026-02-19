// ============================================================
// Axon v4.4 — Auth Types
// Shared type definitions for authentication & authorization
// ============================================================

export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Institution {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan?: string;
}

export interface Membership {
  id: string;
  user_id: string;
  institution_id: string;
  role: MembershipRole;
  institution?: Institution;
  created_at?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  memberships: Membership[];
  currentInstitution: Institution | null;
  currentMembership: Membership | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, institutionId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectInstitution: (instId: string) => void;
  clearError: () => void;
}
