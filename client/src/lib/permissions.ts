// Enhanced RBAC permissions system
export type UserRole = 'master-admin' | 'admin' | 'doctor' | 'nurse' | 'staff' | 'receptionist' | 'analytics-only';

export type Permission = 
  // Patient permissions
  | 'patients.view'
  | 'patients.create'
  | 'patients.edit' 
  | 'patients.deactivate'
  // Appointment permissions
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.edit'
  | 'appointments.cancel'
  | 'appointments.reschedule'
  // Schedule permissions
  | 'schedule.view_own'
  | 'schedule.view_all'
  | 'schedule.manage'
  // Reports permissions
  | 'reports.view'
  | 'reports.export'
  | 'reports.advanced'
  // Clinical permissions
  | 'clinical.notes.view'
  | 'clinical.notes.edit'
  | 'clinical.prescriptions.create'
  // Admin permissions
  | 'admin.view_console'
  | 'admin.manage_users'
  | 'admin.manage_roles'
  | 'admin.manage_clinics'
  | 'admin.view_audit_logs'
  | 'admin.system_settings';

// User permissions cache - will be populated from server
let userPermissionsCache: string[] = [];

// Set user permissions from server response
export function setUserPermissions(permissions: string[]) {
  userPermissionsCache = permissions;
}

// Get user permissions
export function getUserPermissions(): string[] {
  return userPermissionsCache;
}

// Check if user has a specific permission
export function hasPermission(permission: Permission): boolean {
  return userPermissionsCache.includes(permission);
}

// Legacy role-based check for backward compatibility
export function hasLegacyRolePermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  // Legacy role mapping for backward compatibility
  const LEGACY_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    'master-admin': [
      'patients.view', 'patients.create', 'patients.edit', 'patients.deactivate',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.reschedule',
      'schedule.view_all', 'schedule.manage',
      'reports.view', 'reports.export', 'reports.advanced',
      'clinical.notes.view', 'clinical.notes.edit', 'clinical.prescriptions.create',
      'admin.view_console', 'admin.manage_users', 'admin.manage_roles', 'admin.manage_clinics', 'admin.view_audit_logs', 'admin.system_settings',
    ],
    admin: [
      'patients.view', 'patients.create', 'patients.edit', 'patients.deactivate',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.reschedule',
      'schedule.view_all', 'schedule.manage',
      'reports.view', 'reports.export', 'reports.advanced',
      'admin.view_console', 'admin.manage_users'
    ],
    doctor: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.reschedule',
      'schedule.view_all',
      'reports.view', 'reports.export',
      'clinical.notes.view', 'clinical.notes.edit', 'clinical.prescriptions.create'
    ],
    nurse: [
      'patients.view', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.reschedule',
      'schedule.view_all',
      'clinical.notes.view'
    ],
    receptionist: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.reschedule',
      'schedule.view_all'
    ],
    'analytics-only': [
      'patients.view',
      'appointments.view',
      'schedule.view_all',
      'reports.view', 'reports.export', 'reports.advanced'
    ],
    staff: [
      'patients.view',
      'appointments.view',
      'schedule.view_own'
    ],
  };
  
  return LEGACY_ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(permission));
}

export function hasAllPermissions(permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(permission));
}

// Removed duplicate - using the version below that accepts userRole parameter

export function canManageUsers(): boolean {
  return hasPermission('admin.manage_users');
}

export function canManageRoles(): boolean {
  return hasPermission('admin.manage_roles');
}

export function canManagePatients(): boolean {
  return hasPermission('patients.edit');
}

export function canViewAllSchedules(): boolean {
  return hasPermission('schedule.view_all');
}

export function canExportReports(): boolean {
  return hasPermission('reports.export');
}

// Admin console access function - uses proper RBAC system
export function canAccessAdminConsole(userRole?: UserRole): boolean {
  // First try the proper RBAC system (server-loaded permissions)
  if (hasPermission('admin.view_console')) {
    return true;
  }
  
  // Fallback to legacy role-based system if no server permissions loaded
  return hasLegacyRolePermission(userRole, 'admin.view_console');
}

// Legacy functions for backward compatibility  
export function canAccessAdminConsoleLegacy(userRole: UserRole | undefined): boolean {
  return hasLegacyRolePermission(userRole, 'admin.view_console');
}

// Utility functions to load user permissions from server
export async function loadUserPermissions(userId: string): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`/api/admin/users/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const permissions = await response.json();
      setUserPermissions(permissions);
    }
  } catch (error) {
    console.error('Failed to load user permissions:', error);
  }
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'master-admin':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'doctor':
      return 'bg-blue-100 text-blue-800';
    case 'nurse':
      return 'bg-green-100 text-green-800';
    case 'receptionist':
      return 'bg-purple-100 text-purple-800';
    case 'analytics-only':
      return 'bg-yellow-100 text-yellow-800';
    case 'staff':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'master-admin':
      return 'Master Admin';
    case 'admin':
      return 'Admin';
    case 'doctor':
      return 'Doctor';
    case 'nurse':
      return 'Nurse';
    case 'receptionist':
      return 'Receptionist';
    case 'analytics-only':
      return 'Analytics Only';
    case 'staff':
      return 'Staff';
    default:
      return (role as string).replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
}