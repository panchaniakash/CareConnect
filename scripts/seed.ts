import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users, clinics, patients, appointments } from '../shared/schema';
import bcrypt from 'bcryptjs';
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

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create clinics
    const [clinic1, clinic2] = await db.insert(clinics).values([
      {
        name: "Apollo Healthcare Center",
        address: "123 Medical Street, Ahmedabad, Gujarat 380001",
        phone: "+91 79 2550 1234",
        email: "contact@apolloahmedabad.com"
      },
      {
        name: "Sterling Hospital",
        address: "456 Health Avenue, Ahmedabad, Gujarat 380015", 
        phone: "+91 79 2550 5678",
        email: "info@sterlinghospital.com"
      }
    ]).returning();

    console.log('✓ Created clinics');

    // Create users (doctors and staff)
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const [admin, doctor1, doctor2, nurse1, staff1] = await db.insert(users).values([
      {
        email: 'admin@clinic.com',
        password: hashedPassword,
        name: 'Dr. Admin Kumar',
        role: 'admin'
      },
      {
        email: 'dr.shah@clinic.com',
        password: hashedPassword,
        name: 'Dr. Rajesh Shah',
        role: 'doctor'
      },
      {
        email: 'dr.patel@clinic.com',
        password: hashedPassword,
        name: 'Dr. Priya Patel',
        role: 'doctor'
      },
      {
        email: 'nurse.modi@clinic.com',
        password: hashedPassword,
        name: 'Nurse Kavita Modi',
        role: 'nurse'
      },
      {
        email: 'staff.joshi@clinic.com',
        password: hashedPassword,
        name: 'Amit Joshi',
        role: 'staff'
      }
    ]).returning();

    console.log('✓ Created users');

    // Create patients with Indian names (including Akash Panchani for testing)
    const patientData = [
      { firstName: 'Akash', lastName: 'Panchani', phone: '+91 98765 43200', email: 'akash.panchani@email.com', gender: 'male' as const },
      { firstName: 'Arjun', lastName: 'Sharma', phone: '+91 98765 43210', email: 'arjun.sharma@email.com', gender: 'male' as const },
      { firstName: 'Priya', lastName: 'Gupta', phone: '+91 98765 43211', email: 'priya.gupta@email.com', gender: 'female' as const },
      { firstName: 'Rahul', lastName: 'Singh', phone: '+91 98765 43212', email: 'rahul.singh@email.com', gender: 'male' as const },
      { firstName: 'Sneha', lastName: 'Verma', phone: '+91 98765 43213', email: 'sneha.verma@email.com', gender: 'female' as const },
      { firstName: 'Vikash', lastName: 'Kumar', phone: '+91 98765 43214', email: 'vikash.kumar@email.com', gender: 'male' as const },
      { firstName: 'Anita', lastName: 'Jain', phone: '+91 98765 43215', email: 'anita.jain@email.com', gender: 'female' as const },
      { firstName: 'Suresh', lastName: 'Agarwal', phone: '+91 98765 43216', email: 'suresh.agarwal@email.com', gender: 'male' as const },
      { firstName: 'Meera', lastName: 'Reddy', phone: '+91 98765 43217', email: 'meera.reddy@email.com', gender: 'female' as const },
      { firstName: 'Kiran', lastName: 'Mishra', phone: '+91 98765 43218', email: 'kiran.mishra@email.com', gender: 'male' as const },
      { firstName: 'Kavya', lastName: 'Nair', phone: '+91 98765 43219', email: 'kavya.nair@email.com', gender: 'female' as const },
      { firstName: 'Ravi', lastName: 'Iyer', phone: '+91 98765 43220', email: 'ravi.iyer@email.com', gender: 'male' as const },
      { firstName: 'Suman', lastName: 'Desai', phone: '+91 98765 43221', email: 'suman.desai@email.com', gender: 'female' as const },
      { firstName: 'Manoj', lastName: 'Tiwari', phone: '+91 98765 43222', email: 'manoj.tiwari@email.com', gender: 'male' as const },
      { firstName: 'Deepa', lastName: 'Bansal', phone: '+91 98765 43223', email: 'deepa.bansal@email.com', gender: 'female' as const },
      { firstName: 'Ashok', lastName: 'Chandra', phone: '+91 98765 43224', email: 'ashok.chandra@email.com', gender: 'male' as const },
      { firstName: 'Pooja', lastName: 'Saxena', phone: '+91 98765 43225', email: 'pooja.saxena@email.com', gender: 'female' as const },
      { firstName: 'Naveen', lastName: 'Rao', phone: '+91 98765 43226', email: 'naveen.rao@email.com', gender: 'male' as const },
      { firstName: 'Shilpa', lastName: 'Kulkarni', phone: '+91 98765 43227', email: 'shilpa.kulkarni@email.com', gender: 'female' as const },
      { firstName: 'Ajay', lastName: 'Pandey', phone: '+91 98765 43228', email: 'ajay.pandey@email.com', gender: 'male' as const },
      { firstName: 'Swati', lastName: 'Chopra', phone: '+91 98765 43229', email: 'swati.chopra@email.com', gender: 'female' as const }
    ];

    const createdPatients = await db.insert(patients).values(
      patientData.map(patient => ({
        ...patient,
        dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `House ${Math.floor(Math.random() * 999) + 1}, Sector ${Math.floor(Math.random() * 50) + 1}, Ahmedabad, Gujarat`,
        medicalHistory: Math.random() > 0.5 ? 'No significant medical history' : 'Hypertension, Diabetes Type 2'
      }))
    ).returning();

    console.log('✓ Created patients');

    // Create appointments for the next 7 days
    const appointmentTypes = ['consultation', 'checkup', 'followup', 'emergency'] as const;
    const appointmentStatuses = ['scheduled', 'confirmed', 'pending', 'completed'] as const;
    
    const appointments_data: Array<{
      patientId: string;
      clinicId: string;
      doctorId: string;
      appointmentDate: Date;
      duration: number;
      type: "consultation" | "checkup" | "followup" | "emergency";
      status: "scheduled" | "confirmed" | "pending" | "completed";
      notes: string;
    }> = [];
    const today = new Date();
    
    for (let i = 0; i < 15; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + Math.floor(Math.random() * 7));
      appointmentDate.setHours(9 + Math.floor(Math.random() * 8), Math.random() > 0.5 ? 0 : 30);
      
      appointments_data.push({
        patientId: createdPatients[Math.floor(Math.random() * createdPatients.length)].id,
        clinicId: Math.random() > 0.5 ? clinic1.id : clinic2.id,
        doctorId: Math.random() > 0.5 ? doctor1.id : doctor2.id,
        appointmentDate,
        duration: [30, 45, 60][Math.floor(Math.random() * 3)],
        type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        status: appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)],
        notes: Math.random() > 0.5 ? 'Regular checkup' : 'Follow-up required'
      });
    }

    await db.insert(appointments).values(appointments_data);

    console.log('✓ Created appointments');
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Demo Credentials:');
    console.log('   Email: admin@clinic.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('   Doctor: dr.shah@clinic.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('📊 Sample Data Created:');
    console.log(`   • ${patientData.length} patients`);
    console.log(`   • ${appointments_data.length} appointments`);
    console.log('   • 2 clinics');
    console.log('   • 5 users (1 admin, 2 doctors, 1 nurse, 1 staff)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});