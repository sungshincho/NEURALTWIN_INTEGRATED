import { AppRole } from '@/types/auth';

// Feature access levels by role
export const FEATURE_ACCESS: Record<string, AppRole[]> = {
  // Basic features (all roles)
  BASIC_DASHBOARD: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE', 'ORG_VIEWER'],
  BASIC_REPORTS: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE', 'ORG_VIEWER'],
  VIEW_DATA: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE', 'ORG_VIEWER'],

  // Intermediate features (Store and above)
  STORE_MANAGEMENT: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'],
  DATA_INPUT: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'],
  INTERMEDIATE_ANALYTICS: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'],
  BASIC_AI_RECOMMENDATIONS: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'],
  DATA_EXPORT: ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'],

  // Advanced features (HQ only)
  ORGANIZATION_MANAGEMENT: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  MEMBER_MANAGEMENT: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  LICENSE_MANAGEMENT: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  UNLIMITED_STORES: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  ADVANCED_ANALYTICS: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  ADVANCED_AI: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  ETL_PIPELINES: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  CUSTOM_REPORTS: ['NEURALTWIN_MASTER', 'ORG_HQ'],
  API_ACCESS: ['NEURALTWIN_MASTER', 'ORG_HQ'],

  // System admin features (MASTER only)
  SYSTEM_ADMIN: ['NEURALTWIN_MASTER'],
  ALL_ORGS_ACCESS: ['NEURALTWIN_MASTER'],
  MANUAL_LICENSE_ISSUE: ['NEURALTWIN_MASTER'],
};

/**
 * Check if a user role has access to a specific feature
 */
export const hasAccess = (userRole: AppRole | null, feature: string): boolean => {
  if (!userRole) return false;
  return FEATURE_ACCESS[feature]?.includes(userRole) || false;
};

/**
 * Check if a user role can invite members
 */
export const canInviteMembers = (userRole: AppRole | null): boolean => {
  if (!userRole) return false;
  return ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'].includes(userRole);
};

/**
 * Check if a user role can manage organization
 */
export const canManageOrganization = (userRole: AppRole | null): boolean => {
  if (!userRole) return false;
  return ['NEURALTWIN_MASTER', 'ORG_HQ'].includes(userRole);
};

/**
 * Check if a user role can purchase licenses
 */
export const canPurchaseLicenses = (userRole: AppRole | null): boolean => {
  if (!userRole) return false;
  return ['NEURALTWIN_MASTER', 'ORG_HQ', 'ORG_STORE'].includes(userRole);
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: AppRole): string => {
  const roleNames: Record<AppRole, string> = {
    NEURALTWIN_MASTER: 'System Admin',
    ORG_HQ: 'HQ Manager',
    ORG_STORE: 'Store Manager',
    ORG_VIEWER: 'Viewer',
  };
  return roleNames[role] || role;
};

/**
 * Get role description
 */
export const getRoleDescription = (role: AppRole): string => {
  const descriptions: Record<AppRole, string> = {
    NEURALTWIN_MASTER: 'Full system access - all organizations',
    ORG_HQ: 'Full organization access - all features',
    ORG_STORE: 'Store management - intermediate features',
    ORG_VIEWER: 'Read-only access - view data only',
  };
  return descriptions[role] || '';
};

/**
 * Get accessible features for a role
 */
export const getAccessibleFeatures = (role: AppRole): string[] => {
  return Object.keys(FEATURE_ACCESS).filter(feature => 
    FEATURE_ACCESS[feature].includes(role)
  );
};
