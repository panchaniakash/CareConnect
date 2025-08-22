-- CareConnect Healthcare Management System Database Schema
-- PostgreSQL Database Schema

-- Create database (run this separately if needed)
-- CREATE DATABASE careconnect;

-- Connect to the database
-- \c careconnect;

-- Create custom types (enums)
CREATE TYPE "role" AS ENUM ('admin', 'doctor', 'nurse', 'staff');
CREATE TYPE "gender" AS ENUM ('male', 'female', 'other');
CREATE TYPE "appointment_status" AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'pending');
CREATE TYPE "appointment_type" AS ENUM ('consultation', 'checkup', 'followup', 'emergency');

-- Create users table
CREATE TABLE "users" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'staff',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create clinics table
CREATE TABLE "clinics" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create patients table
CREATE TABLE "patients" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP,
    "gender" "gender",
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "medical_history" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE "appointments" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "patient_id" VARCHAR NOT NULL REFERENCES "patients"("id"),
    "clinic_id" VARCHAR NOT NULL REFERENCES "clinics"("id"),
    "doctor_id" VARCHAR NOT NULL REFERENCES "users"("id"),
    "appointment_date" TIMESTAMP NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "type" "appointment_type" NOT NULL,
    "status" "appointment_status" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_patients_phone" ON "patients" ("phone");
CREATE INDEX "idx_patients_name" ON "patients" ("first_name", "last_name");
CREATE INDEX "idx_patients_active" ON "patients" ("is_active");
CREATE INDEX "idx_appointments_patient" ON "appointments" ("patient_id");
CREATE INDEX "idx_appointments_doctor" ON "appointments" ("doctor_id");
CREATE INDEX "idx_appointments_clinic" ON "appointments" ("clinic_id");
CREATE INDEX "idx_appointments_date" ON "appointments" ("appointment_date");
CREATE INDEX "idx_appointments_status" ON "appointments" ("status");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "users" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON "patients" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON "appointments" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert clinics
INSERT INTO "clinics" ("name", "address", "phone", "email") VALUES 
('Apollo Healthcare Center', '123 Medical Street, Local City, State 12345', '+1-555-0123', 'contact@apollolocal.com'),
('Sterling Hospital', '456 Health Avenue, Local City, State 12346', '+1-555-0456', 'info@sterlinglocal.com');

-- Insert users (password is 'admin123' hashed with bcrypt)
INSERT INTO "users" ("email", "password", "name", "role") VALUES 
('admin@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8wJes.FGoS', 'Dr. Admin Kumar', 'admin'),
('dr.shah@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8wJes.FGoS', 'Dr. Rajesh Shah', 'doctor'),
('dr.patel@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8wJes.FGoS', 'Dr. Priya Patel', 'doctor'),
('nurse.modi@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8wJes.FGoS', 'Nurse Kavita Modi', 'nurse'),
('staff.joshi@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8wJes.FGoS', 'Amit Joshi', 'staff');

-- Insert sample patients
INSERT INTO "patients" ("first_name", "last_name", "phone", "email", "gender", "date_of_birth", "address", "medical_history") VALUES 
('John', 'Smith', '+1-555-1001', 'john.smith@email.com', 'male', '1985-03-15', '789 Oak Street, Local City, State 12347', 'No significant medical history'),
('Sarah', 'Johnson', '+1-555-1002', 'sarah.johnson@email.com', 'female', '1990-07-22', '321 Pine Avenue, Local City, State 12348', 'Hypertension'),
('Michael', 'Brown', '+1-555-1003', 'michael.brown@email.com', 'male', '1988-11-08', '654 Maple Drive, Local City, State 12349', 'Diabetes Type 2'),
('Emily', 'Davis', '+1-555-1004', 'emily.davis@email.com', 'female', '1992-01-30', '987 Elm Street, Local City, State 12350', 'No significant medical history'),
('David', 'Wilson', '+1-555-1005', 'david.wilson@email.com', 'male', '1980-09-12', '147 Cedar Lane, Local City, State 12351', 'High cholesterol'),
('Lisa', 'Garcia', '+1-555-1006', 'lisa.garcia@email.com', 'female', '1987-05-18', '258 Birch Road, Local City, State 12352', 'Allergies to penicillin'),
('Robert', 'Martinez', '+1-555-1007', 'robert.martinez@email.com', 'male', '1995-12-03', '369 Spruce Circle, Local City, State 12353', 'No significant medical history'),
('Jennifer', 'Anderson', '+1-555-1008', 'jennifer.anderson@email.com', 'female', '1983-08-25', '741 Willow Way, Local City, State 12354', 'Asthma'),
('William', 'Taylor', '+1-555-1009', 'william.taylor@email.com', 'male', '1991-04-14', '852 Poplar Place, Local City, State 12355', 'No significant medical history'),
('Michelle', 'Thomas', '+1-555-1010', 'michelle.thomas@email.com', 'female', '1989-10-07', '963 Cherry Court, Local City, State 12356', 'Migraine headaches');

-- Note: Sample appointments will be created by the application seed script
-- as they need to reference the actual IDs generated above

COMMENT ON DATABASE careconnect IS 'CareConnect Healthcare Management System Database';
COMMENT ON TABLE "users" IS 'System users including doctors, nurses, staff, and administrators';
COMMENT ON TABLE "clinics" IS 'Healthcare clinics and facilities';
COMMENT ON TABLE "patients" IS 'Patient records and information';
COMMENT ON TABLE "appointments" IS 'Patient appointments and scheduling';