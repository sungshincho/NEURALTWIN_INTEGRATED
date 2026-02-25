/**
 * Role-based permission configuration
 * Based on integrated-development-plan.md
 */

export const APP_ROLES = {
  NEURALTWIN_MASTER: "NEURALTWIN_MASTER",
  ORG_HQ: "ORG_HQ",
  ORG_STORE: "ORG_STORE",
  ORG_VIEWER: "ORG_VIEWER",
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

export const LICENSE_TYPES = {
  HQ_SEAT: "HQ_SEAT",
  STORE: "STORE",
} as const;

export type LicenseType = typeof LICENSE_TYPES[keyof typeof LICENSE_TYPES];

export const LICENSE_STATUS = {
  ACTIVE: "active",
  ASSIGNED: "assigned",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
  REVOKED: "revoked",
} as const;

/**
 * Feature permissions by role
 */
export const ROLE_PERMISSIONS = {
  [APP_ROLES.NEURALTWIN_MASTER]: {
    canManageSystem: true,
    canManageOrganizations: true,
    canManageAllStores: true,
    canAccessAdvancedAnalytics: true,
    canAccessAI: true,
    canManageETL: true,
    canInviteUsers: true,
    canManageLicenses: true,
    requiresLicense: false,
  },
  [APP_ROLES.ORG_HQ]: {
    canManageSystem: false,
    canManageOrganizations: true,
    canManageAllStores: true,
    canAccessAdvancedAnalytics: true,
    canAccessAI: true,
    canManageETL: true,
    canInviteUsers: true,
    canManageLicenses: true,
    requiresLicense: true,
    requiredLicenseType: LICENSE_TYPES.HQ_SEAT,
  },
  [APP_ROLES.ORG_STORE]: {
    canManageSystem: false,
    canManageOrganizations: false,
    canManageAllStores: false,
    canAccessAdvancedAnalytics: false,
    canAccessAI: true,
    canManageETL: false,
    canInviteUsers: true,
    canManageLicenses: false,
    requiresLicense: true,
    requiredLicenseType: LICENSE_TYPES.STORE,
  },
  [APP_ROLES.ORG_VIEWER]: {
    canManageSystem: false,
    canManageOrganizations: false,
    canManageAllStores: false,
    canAccessAdvancedAnalytics: false,
    canAccessAI: false,
    canManageETL: false,
    canInviteUsers: false,
    canManageLicenses: false,
    requiresLicense: false,
  },
} as const;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string | null, permission: keyof typeof ROLE_PERMISSIONS[AppRole]): boolean {
  if (!role) return false;
  const rolePerms = ROLE_PERMISSIONS[role as AppRole];
  if (!rolePerms) return false;
  return rolePerms[permission] === true;
}

/**
 * Check if a role requires a valid license
 */
export function requiresValidLicense(role: string | null): boolean {
  if (!role) return false;
  const rolePerms = ROLE_PERMISSIONS[role as AppRole];
  return rolePerms?.requiresLicense || false;
}

/**
 * Get required license type for a role
 */
export function getRequiredLicenseType(role: string | null): LicenseType | null {
  if (!role) return null;
  const rolePerms = ROLE_PERMISSIONS[role as AppRole];
  return (rolePerms as any)?.requiredLicenseType || null;
}

/**
 * Validate license for role
 */
export function validateLicenseForRole(
  role: string | null,
  licenseType: string | null,
  licenseStatus: string | null
): { valid: boolean; reason?: string } {
  if (!role) {
    return { valid: false, reason: "역할 정보가 없습니다." };
  }

  const needsLicense = requiresValidLicense(role);
  
  if (!needsLicense) {
    return { valid: true };
  }

  if (!licenseStatus || (licenseStatus !== LICENSE_STATUS.ACTIVE && licenseStatus !== LICENSE_STATUS.ASSIGNED)) {
    return { valid: false, reason: "유효한 라이선스가 필요합니다." };
  }

  const requiredType = getRequiredLicenseType(role);
  if (requiredType && licenseType !== requiredType) {
    return { valid: false, reason: `${requiredType} 라이선스가 필요합니다.` };
  }

  return { valid: true };
}
