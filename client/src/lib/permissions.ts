// Role-based permissions system
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'staff';

export type Permission = 
  | 'patients.view'
  | 'patients.edit' 
  | 'patients.create'
  | 'patients.deactivate'
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.edit'
  | 'appointments.cancel'
  | 'appointments.reschedule'
  | 'reports.view'
  | 'reports.export'
  | 'schedule.view_all'
  | 'schedule.view_own'
  | 'admin.manage_users'
  | 'admin.manage_roles'
  | 'admin.view_console';

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'patients.view',
    'patients.edit',
    'patients.create', 
    'patients.deactivate',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.cancel',
    'appointments.reschedule',
    'reports.view',
    'reports.export',
    'schedule.view_all',
    'admin.manage_users',
    'admin.manage_roles',
    'admin.view_console',
  ],
  doctor: [
    'patients.view',
    'patients.edit',
    'patients.create',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.cancel',
    'appointments.reschedule',
    'reports.view',
    'schedule.view_all',
  ],
  nurse: [
    'patients.view',
    'patients.edit',
    'appointments.view',
    'appointments.create',
    'appointments.reschedule',
    'schedule.view_all',
  ],
  staff: [
    'patients.view',
    'appointments.view',
    'appointments.create',
    'schedule.view_own',
  ],
};

export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function canAccessAdminConsole(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'admin.manage_users');
}

export function canManagePatients(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'patients.edit');
}

export function canViewAllSchedules(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'schedule.view_all');
}

export function canExportReports(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'reports.export');
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'doctor':
      return 'bg-blue-100 text-blue-800';
    case 'nurse':
      return 'bg-green-100 text-green-800';
    case 'staff':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'doctor':
      return 'Doctor';
    case 'nurse':
      return 'Nurse';
    case 'staff':
      return 'Staff';
    default:
      return role;
  }
}