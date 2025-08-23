import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["admin", "doctor", "nurse", "staff"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "completed", "cancelled", "pending"]);
export const appointmentTypeEnum = pgEnum("appointment_type", ["consultation", "checkup", "followup", "emergency"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("staff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  medicalHistory: text("medical_history"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(30).notNull(), // in minutes
  type: appointmentTypeEnum("type").notNull(),
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const clinicsRelations = relations(clinics, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  createdAt: z.coerce.date(), // 👈 allows string or Dat
  updatedAt: z.coerce.date(), // 👈 allows string or Date
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// export const insertPatientSchema = createInsertSchema(patients).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });

export const insertPatientSchema = createInsertSchema(patients, {
  dateOfBirth: z.coerce.date().optional(), // 👈 fixes date issue
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertAppointmentSchema = createInsertSchema(appointments, {
  appointmentDate: z.coerce.date(),  // 👈 allows string or Date
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



export const insertClinicSchema = createInsertSchema(clinics, {
  createdAt: z.coerce.date(), // 👈 allows string or Date
}).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Extended types with relations
export type AppointmentWithRelations = Appointment & {
  patient: Patient;
  doctor: User;
  clinic: Clinic;
};
