import { 
  users, patients, appointments, clinics,
  type User, type InsertUser, 
  type Patient, type InsertPatient,
  type Appointment, type InsertAppointment, type AppointmentWithRelations,
  type Clinic, type InsertClinic
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, ilike, desc, asc } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient methods
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(query?: string, limit?: number, offset?: number): Promise<Patient[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatients(query?: string, limit = 10, offset = 0): Promise<Patient[]> {
    const conditions = [eq(patients.isActive, true)];
    
    if (query) {
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
