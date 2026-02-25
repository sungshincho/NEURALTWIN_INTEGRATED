// Role types based on database enum
export type AppRole = 'NEURALTWIN_MASTER' | 'ORG_HQ' | 'ORG_STORE' | 'ORG_VIEWER';

// License types
export type LicenseType = 'HQ_SEAT' | 'STORE';

// Subscription status
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'expired';

// License interface
export interface License {
  id: string;
  org_id: string;
  subscription_id: string;
  license_type: LicenseType;
  license_key: string;
  status: 'active' | 'assigned' | 'suspended' | 'expired' | 'revoked';
  monthly_price: number;
  effective_date: string;
  expiry_date?: string;
  next_billing_date: string;
  assigned_to?: string;
  assigned_store_id?: string;
  activated_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

// Subscription interface
export interface Subscription {
  id: string;
  org_id: string;
  subscription_type: 'LICENSE_BASED' | 'ENTERPRISE_CONTRACT';
  status: SubscriptionStatus;
  hq_license_count: number;
  store_license_count: number;
  viewer_count: number;
  monthly_cost: number;
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// Organization member interface
export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: AppRole;
  license_id?: string;
  invited_by?: string;
  invitation_accepted_at?: string;
  permissions?: {
    storeIds?: string[];
    features?: string[];
    canInvite?: boolean;
    canExport?: boolean;
  };
  joined_at: string;
  created_at: string;
  updated_at: string;
}

// Organization interface
export interface Organization {
  id: string;
  org_name: string;
  created_by: string;
  member_count: number;
  metadata?: {
    country?: string;
    industry?: string;
    company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    phone?: string;
    address?: string;
    website?: string;
    billing_email?: string;
  };
  created_at: string;
  updated_at: string;
}

// User auth context
export interface UserAuthContext {
  userId: string;
  email: string;
  role: AppRole;
  orgId: string;
  orgName: string;
  license?: License;
  permissions: {
    storeIds?: string[];
    features?: string[];
    canInvite?: boolean;
    canExport?: boolean;
  };
}
