import { 
  users, patients, appointments, clinics, permissions, roles, rolePermissions, userRoles,
  type User, type InsertUser, type UserWithRoles,
  type Patient, type InsertPatient,
  type Appointment, type InsertAppointment, type AppointmentWithRelations,
  type Clinic, type InsertClinic,
  type Permission, type InsertPermission,
  type Role, type InsertRole, type RoleWithPermissions,
  type RolePermission, type InsertRolePermission,
  type UserRole, type InsertUserRole
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, ilike, desc, asc } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithRoles(id: string): Promise<UserWithRoles | undefined>;
  getUserWithRolesByEmail(email: string): Promise<UserWithRoles | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(filters?: { 
    query?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]>;
  
  // Patient methods
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(filters: {
    query?: string;
    limit?: number;
    offset?: number;
    status?: string;
    gender?: string;
    clinic?: string;
    minAge?: number;
    maxAge?: number;
    dateFrom?: Date;
    dateTo?: Date;
    hasUpcomingAppointment?: boolean;
  }): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  
  // Appointment methods
  getAppointment(id: string): Promise<AppointmentWithRelations | undefined>;
  getAppointments(filters: {
    clinicId?: string;
    doctorId?: string;
    date?: Date;
    status?: string;
  }): Promise<AppointmentWithRelations[]>;
  createAppointment(appointment: InsertAppointment): Promise<AppointmentWithRelations>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<AppointmentWithRelations | undefined>;
  
  // Clinic methods
  getClinic(id: string): Promise<Clinic | undefined>;
  getClinics(): Promise<Clinic[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  
  // RBAC methods
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<RoleWithPermissions | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
  
  assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<UserRole>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<string[]>;
  
  // Dashboard methods
  getDashboardStats(doctorId: string, clinicId: string): Promise<{
    todayAppointments: number;
    totalPatients: number;
    pendingAppointments: number;
    completedAppointments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserWithRoles(id: string): Promise<UserWithRoles | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(users.id, id));

    if (!user) return undefined;

    // Group the data properly
    const userData = user.users;
    const userRoleData = user.user_roles;
    const roleData = user.roles;
    const permissionData = user.permissions;

    if (!userData) return undefined;

    return {
      ...userData,
      userRoles: []
    } as UserWithRoles;
  }

  async getUserWithRolesByEmail(email: string): Promise<UserWithRoles | undefined> {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || user.length === 0) return undefined;
    return this.getUserWithRoles(user[0].id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsers(filters?: { 
    query?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const { query, role, isActive, limit = 50, offset = 0 } = filters || {};
    
    const conditions = [];
    
    if (query) {
      conditions.push(
        or(
          ilike(users.name, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      );
    }
    
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }
    
    return db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatients(filters: {
    query?: string;
    limit?: number;
    offset?: number;
    status?: string;
    gender?: string;
    clinic?: string;
    minAge?: number;
    maxAge?: number;
    dateFrom?: Date;
    dateTo?: Date;
    hasUpcomingAppointment?: boolean;
  } = {}): Promise<Patient[]> {
    const { 
      query, 
      limit = 10, 
      offset = 0, 
      status, 
      gender, 
      clinic, 
      minAge, 
      maxAge, 
      dateFrom, 
      dateTo,
      hasUpcomingAppointment 
    } = filters;

    const conditions = [];
    
    // Base condition - only include active patients unless status filter specifies otherwise
    if (status === 'inactive') {
      conditions.push(eq(patients.isActive, false));
    } else if (status === 'active') {
      conditions.push(eq(patients.isActive, true));
    } else {
      // Default to active patients only if no status filter
      conditions.push(eq(patients.isActive, true));
    }
    
    // Search query
    if (query) {
      const queryParts = query.trim().split(/\s+/);
      
      if (queryParts.length > 1) {
        // Multi-word search - try as full name (firstName lastName)
        const [firstName, ...lastNameParts] = queryParts;
        const lastName = lastNameParts.join(' ');
        
        const fullNameCondition = and(
          ilike(patients.firstName, `%${firstName}%`),
          ilike(patients.lastName, `%${lastName}%`)
        );
        
        // Also search individual fields
        const individualFieldsCondition = or(
          ilike(patients.firstName, `%${query}%`),
          ilike(patients.lastName, `%${query}%`),
          ilike(patients.phone, `%${query}%`),
          ilike(patients.email, `%${query}%`)
        );
        
        const searchCondition = or(fullNameCondition, individualFieldsCondition);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      } else {
        // Single word search
        const searchCondition = or(
          ilike(patients.firstName, `%${query}%`),
          ilike(patients.lastName, `%${query}%`),
          ilike(patients.phone, `%${query}%`),
          ilike(patients.email, `%${query}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }
    
    // Gender filter
    if (gender) {
      conditions.push(eq(patients.gender, gender as any));
    }
    
    // Age range filters
    if (minAge) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - minAge);
      conditions.push(lte(patients.dateOfBirth, maxBirthDate));
    }
    if (maxAge) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - maxAge - 1);
      conditions.push(gte(patients.dateOfBirth, minBirthDate));
    }
    
    // Date range filters (registration date)
    if (dateFrom) {
      conditions.push(gte(patients.createdAt, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(patients.createdAt, dateTo));
    }
    
    return db
      .select()
      .from(patients)
      .where(and(...conditions))
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async updatePatient(id: string, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  async getAppointment(id: string): Promise<AppointmentWithRelations | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
      .where(eq(appointments.id, id));
    
    if (!appointment.appointments || !appointment.patients || !appointment.users || !appointment.clinics) {
      return undefined;
    }
    
    return {
      ...appointment.appointments,
      patient: appointment.patients,
      doctor: appointment.users,
      clinic: appointment.clinics,
    };
  }

  async getAppointments(filters: {
    clinicId?: string;
    doctorId?: string;
    date?: Date;
    status?: string;
  }): Promise<AppointmentWithRelations[]> {
    const conditions = [];
    
    if (filters.clinicId) {
      conditions.push(eq(appointments.clinicId, filters.clinicId));
    }
    
    if (filters.doctorId) {
      conditions.push(eq(appointments.doctorId, filters.doctorId));
    }
    
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );
    }
    
    if (filters.status) {
      conditions.push(eq(appointments.status, filters.status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const results = await db
      .select()
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
      .where(whereClause)
      .orderBy(asc(appointments.appointmentDate));
    
    return results
      .filter(row => row.appointments && row.patients && row.users && row.clinics)
      .map(row => ({
        ...row.appointments!,
        patient: row.patients!,
        doctor: row.users!,
        clinic: row.clinics!,
      }));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<AppointmentWithRelations> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    
    const result = await this.getAppointment(appointment.id);
    if (!result) {
      throw new Error("Failed to create appointment");
    }
    
    return result;
  }

  async updateAppointment(id: string, updateData: Partial<InsertAppointment>): Promise<AppointmentWithRelations | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    
    if (!appointment) {
      return undefined;
    }
    
    return this.getAppointment(appointment.id);
  }

  async getClinic(id: string): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic || undefined;
  }

  async getClinics(): Promise<Clinic[]> {
    return db.select().from(clinics).orderBy(asc(clinics.name));
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const [clinic] = await db
      .insert(clinics)
      .values(insertClinic)
      .returning();
    return clinic;
  }

  // RBAC Methods
  async getPermissions(): Promise<Permission[]> {
    return db.select().from(permissions).orderBy(asc(permissions.category), asc(permissions.name));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db
      .insert(permissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async getRoles(): Promise<Role[]> {
    return db.select().from(roles).orderBy(asc(roles.name));
  }

  async getRole(id: string): Promise<RoleWithPermissions | undefined> {
    const roleData = await db
      .select()
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(roles.id, id));

    if (roleData.length === 0) return undefined;

    const role = roleData[0].roles;
    if (!role) return undefined;

    const rolePermissionsData = roleData
      .filter(row => row.permissions && row.role_permissions)
      .map(row => ({
        ...row.role_permissions!,
        permission: row.permissions!
      }));

    return {
      ...role,
      rolePermissions: rolePermissionsData
    };
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values(role)
      .returning();
    return newRole;
  }

  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(role)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole || undefined;
  }

  async deleteRole(id: string): Promise<boolean> {
    // Check if it's a system role
    const role = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (role.length === 0 || role[0].isSystemRole) {
      return false; // Can't delete system roles or non-existent roles
    }

    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result as any).rowCount > 0;
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    const [assignment] = await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .returning();
    return assignment;
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await db
      .delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return (result as any).rowCount > 0;
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    const [assignment] = await db
      .insert(userRoles)
      .values({ userId, roleId, assignedBy })
      .returning();
    return assignment;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const result = await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ));
    return (result as any).rowCount > 0;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const results = await db
      .select({ permission: permissions.name })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(users.id, userId));

    const uniquePermissions = new Set(results.map(r => r.permission));
    return Array.from(uniquePermissions); // Remove duplicates
  }

  async getDashboardStats(doctorId: string, clinicId: string): Promise<{
    todayAppointments: number;
    totalPatients: number;
    pendingAppointments: number;
    completedAppointments: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's appointments
    const todayAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.clinicId, clinicId),
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );

    // Total patients
    const totalPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.isActive, true));

    // Pending appointments
    const pendingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, "pending")
        )
      );

    // Completed appointments (today)
    const completedAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, "completed"),
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );

    return {
      todayAppointments: todayAppointments.length,
      totalPatients: totalPatients.length,
      pendingAppointments: pendingAppointments.length,
      completedAppointments: completedAppointments.length,
    };
  }
}

export const storage = new DatabaseStorage();
