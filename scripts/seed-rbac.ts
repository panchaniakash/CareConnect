import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { permissions, roles, rolePermissions, users, userRoles } from '../shared/schema';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import * as schema from '../shared/schema';
import dotenv from "dotenv";
dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Comprehensive permissions list
const PERMISSIONS = [
  // Patient permissions
  { name: 'patients.view', description: 'View patient information', category: 'patients' },
  { name: 'patients.create', description: 'Create new patients', category: 'patients' },
  { name: 'patients.edit', description: 'Edit patient information', category: 'patients' },
  { name: 'patients.deactivate', description: 'Deactivate patients', category: 'patients' },
  
  // Appointment permissions
  { name: 'appointments.view', description: 'View appointments', category: 'appointments' },
  { name: 'appointments.create', description: 'Create appointments', category: 'appointments' },
  { name: 'appointments.edit', description: 'Edit appointments', category: 'appointments' },
  { name: 'appointments.cancel', description: 'Cancel appointments', category: 'appointments' },
  { name: 'appointments.reschedule', description: 'Reschedule appointments', category: 'appointments' },
  
  // Schedule permissions
  { name: 'schedule.view_own', description: 'View own schedule', category: 'schedule' },
  { name: 'schedule.view_all', description: 'View all schedules', category: 'schedule' },
  { name: 'schedule.manage', description: 'Manage schedules', category: 'schedule' },
  
  // Reports permissions
  { name: 'reports.view', description: 'View reports', category: 'reports' },
  { name: 'reports.export', description: 'Export reports', category: 'reports' },
  { name: 'reports.advanced', description: 'Access advanced analytics', category: 'reports' },
  
  // Clinical permissions
  { name: 'clinical.notes.view', description: 'View clinical notes', category: 'clinical' },
  { name: 'clinical.notes.edit', description: 'Edit clinical notes', category: 'clinical' },
  { name: 'clinical.prescriptions.create', description: 'Create prescriptions', category: 'clinical' },
  
  // Admin permissions
  { name: 'admin.view_console', description: 'Access admin console', category: 'admin' },
  { name: 'admin.manage_users', description: 'Manage users', category: 'admin' },
  { name: 'admin.manage_roles', description: 'Manage roles and permissions', category: 'admin' },
  { name: 'admin.manage_clinics', description: 'Manage clinics', category: 'admin' },
  { name: 'admin.view_audit_logs', description: 'View audit logs', category: 'admin' },
  { name: 'admin.system_settings', description: 'Modify system settings', category: 'admin' },
];

// Role definitions with their permissions
const ROLES = [
  {
    name: 'Master Admin',
    description: 'Full system access with all permissions',
    isSystemRole: true,
    permissions: PERMISSIONS.map(p => p.name) // All permissions
  },
  {
    name: 'Clinic Admin',
    description: 'Administrative access within clinic scope',
    isSystemRole: true,
    permissions: [
      'patients.view', 'patients.create', 'patients.edit', 'patients.deactivate',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.reschedule',
      'schedule.view_all', 'schedule.manage',
      'reports.view', 'reports.export', 'reports.advanced',
      'admin.view_console', 'admin.manage_users'
    ]
  },
  {
    name: 'Doctor',
    description: 'Medical professional with clinical access',
    isSystemRole: true,
    permissions: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.reschedule',
      'schedule.view_all',
      'reports.view', 'reports.export',
      'clinical.notes.view', 'clinical.notes.edit', 'clinical.prescriptions.create'
    ]
  },
  {
    name: 'Nurse',
    description: 'Nursing staff with patient care access',
    isSystemRole: true,
    permissions: [
      'patients.view', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.reschedule',
      'schedule.view_all',
      'clinical.notes.view'
    ]
  },
  {
    name: 'Receptionist',
    description: 'Front desk staff for scheduling and patient management',
    isSystemRole: true,
    permissions: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.reschedule',
      'schedule.view_all'
    ]
  },
  {
    name: 'Analytics Only',
    description: 'Read-only access for reports and analytics',
    isSystemRole: true,
    permissions: [
      'patients.view',
      'appointments.view',
      'schedule.view_all',
      'reports.view', 'reports.export', 'reports.advanced'
    ]
  },
  {
    name: 'Staff',
    description: 'Basic staff access',
    isSystemRole: true,
    permissions: [
      'patients.view',
      'appointments.view',
      'schedule.view_own'
    ]
  }
];

async function seedRBAC() {
  try {
    console.log('🌱 Starting RBAC seeding...');

    // 1. Create permissions
    console.log('Creating permissions...');
    const createdPermissions = await db.insert(permissions).values(PERMISSIONS).onConflictDoNothing().returning();
    
    // Get all permissions (including existing ones)
    const allPermissions = await db.select().from(permissions);
    const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));
    
    console.log(`✓ ${allPermissions.length} permissions available`);

    // 2. Create roles
    console.log('Creating roles...');
    for (const roleData of ROLES) {
      const [role] = await db.insert(roles).values({
        name: roleData.name,
        description: roleData.description,
        isSystemRole: roleData.isSystemRole
      }).onConflictDoNothing().returning();

      if (role) {
        console.log(`✓ Created role: ${role.name}`);
        
        // 3. Assign permissions to role
        const rolePermissionValues = roleData.permissions
          .map(permissionName => {
            const permissionId = permissionMap.get(permissionName);
            if (!permissionId) {
              console.warn(`Warning: Permission '${permissionName}' not found`);
              return null;
            }
            return {
              roleId: role.id,
              permissionId: permissionId
            };
          })
          .filter(Boolean);

        if (rolePermissionValues.length > 0) {
          await db.insert(rolePermissions).values(rolePermissionValues as any).onConflictDoNothing();
          console.log(`  ✓ Assigned ${rolePermissionValues.length} permissions to ${role.name}`);
        }
      }
    }

    // 4. Update existing users to have proper roles
    console.log('Assigning roles to existing users...');
    
    // Get all roles
    const allRoles = await db.select().from(roles);
    const roleMap = new Map(allRoles.map(r => [r.name.toLowerCase().replace(/[\s-]/g, '_'), r.id]));
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      let roleId: string | undefined;
      
      // Map legacy enum role to new role system
      switch (user.role) {
        case 'master-admin':
          roleId = roleMap.get('master_admin');
          break;
        case 'admin':
          roleId = roleMap.get('clinic_admin');
          break;
        case 'doctor':
          roleId = roleMap.get('doctor');
          break;
        case 'nurse':
          roleId = roleMap.get('nurse');
          break;
        case 'receptionist':
          roleId = roleMap.get('receptionist');
          break;
        case 'analytics-only':
          roleId = roleMap.get('analytics_only');
          break;
        case 'staff':
        default:
          roleId = roleMap.get('staff');
          break;
      }
      
      if (roleId) {
        await db.insert(userRoles).values({
          userId: user.id,
          roleId: roleId
        }).onConflictDoNothing();
        console.log(`✓ Assigned role to user: ${user.name} (${user.email})`);
      }
    }

    console.log('\n🎉 RBAC seeding completed successfully!');
    
    console.log('\n📊 Summary:');
    console.log(`• ${PERMISSIONS.length} permissions created`);
    console.log(`• ${ROLES.length} system roles created`);
    console.log(`• ${allUsers.length} users assigned roles`);
    
    console.log('\n🔑 Available Roles:');
    for (const role of ROLES) {
      console.log(`• ${role.name}: ${role.permissions.length} permissions`);
    }

  } catch (error) {
    console.error('❌ RBAC seeding failed:', error);
    throw error;
  }
}

// Run the seeding
seedRBAC().catch(console.error);