import { UserRole, Permission } from '../types';

/**
 * Role-Based Access Control (RBAC) Matrix
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  customer: [],
  staff: [
    'manage_orders',
    'view_reports',
  ],
  admin: [
    'manage_customers',
    'manage_orders',
    'manage_menu',
    'manage_pricing',
    'manage_promotions',
    'manage_inventory',
    'view_reports',
    'manage_settings',
  ],
  super_admin: [
    'manage_customers',
    'manage_orders',
    'manage_menu',
    'manage_pricing',
    'manage_promotions',
    'manage_inventory',
    'view_reports',
    'manage_settings',
    'manage_staff',
    'delete_records',
    'configure_system',
  ],
};

/**
 * Checks if a given role has the requested permission.
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Returns all permissions associated with a role.
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
