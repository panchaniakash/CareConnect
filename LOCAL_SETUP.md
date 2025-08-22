# Local Setup Guide

## Prerequisites

1. **Node.js 20+** installed on your machine
2. **PostgreSQL** installed and running locally
3. **Git** to clone the repository

## Database Setup

### 1. Create PostgreSQL Database

Connect to PostgreSQL as a superuser and create the database:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE careconnect;

-- Create a user (optional)
CREATE USER careconnect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE careconnect TO careconnect_user;

-- Exit psql
\q
```

### 2. Run Database Schema

Execute the schema file to create tables:

```bash
# Option 1: Using psql command
psql -U postgres -d careconnect -f database/schema.sql

# Option 2: Using psql interactive mode
psql -U postgres -d careconnect
\i database/schema.sql
\q
```

## Application Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your local database credentials:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/careconnect
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=3000
```

### 3. Run Database Migrations

```bash
npm run db:push
```

### 4. Seed Sample Data (Optional)

```bash
npx tsx scripts/seed.ts
```

This will create:
- 2 sample clinics
- 5 users (admin, doctors, nurse, staff) 
- 20 sample patients
- 15 sample appointments

### 5. Start the Application

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Demo Credentials

After seeding, you can log in with:

- **Admin**: admin@clinic.com / admin123
- **Doctor**: dr.shah@clinic.com / admin123
- **Doctor**: dr.patel@clinic.com / admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /api/health/ready` - Health check endpoint

### Patients
- `GET /api/patients` - Get patients (with search)
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient

### Appointments  
- `GET /api/appointments` - Get appointments (with filters)
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Clinics
- `GET /api/clinics` - Get all clinics
- `POST /api/clinics` - Create new clinic

## Testing the Application

1. Open http://localhost:5173
2. Log in with demo credentials
3. Try creating a new patient
4. Schedule an appointment
5. View the dashboard with today's appointments

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_ctl status`
- Check DATABASE_URL in .env file
- Verify database exists: `psql -l`

### Port Conflicts
- Change PORT in .env if 3000 is occupied
- Frontend port can be changed in vite.config.ts

### Missing Dependencies
```bash
npm install
```

### Schema Issues
```bash
# Reset and recreate schema
psql -U postgres -d careconnect -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U postgres -d careconnect -f database/schema.sql
```