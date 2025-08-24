# CareConnect Healthcare Management System - Setup Guide

## Overview

This guide will help you set up and deploy the CareConnect Healthcare Management System, a full-stack application with React frontend, Express.js backend, and PostgreSQL database.

## System Requirements

### Development Environment
- Node.js 20+ 
- PostgreSQL 13+
- Git
- Modern web browser

### Production Environment
- Node.js 20+ (LTS recommended)
- PostgreSQL 13+ (managed service recommended)
- SSL certificate for HTTPS
- Domain name
- Sufficient server resources (minimum 2GB RAM, 2 CPU cores)

## Quick Start (Development)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd careconnect

# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Using Replit (Automatic)
If running on Replit, the database is automatically provisioned. Skip to step 3.

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE careconnect;
CREATE USER careconnect_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE careconnect TO careconnect_user;
\q
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/careconnect

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Server Configuration
NODE_ENV=development
PORT=5000

# Optional: Session Configuration
SESSION_SECRET=your-session-secret-key
```

### 4. Database Migration and Seeding

```bash
# Push database schema
npm run db:push

# Seed initial data
npx tsx scripts/seed.ts

# Seed RBAC (roles and permissions)
npx tsx scripts/seed-rbac.ts
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

### Environment Variables

Set the following environment variables in your production environment:

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-production-jwt-secret-minimum-32-characters
NODE_ENV=production

# Optional
PORT=5000
SESSION_SECRET=your-production-session-secret
```

### Build and Deploy

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Start the production server
npm start
```

### Database Setup (Production)

1. **Create Production Database**
   ```sql
   CREATE DATABASE careconnect_prod;
   ```

2. **Run Migrations**
   ```bash
   npm run db:push
   ```

3. **Seed Production Data**
   ```bash
   npx tsx scripts/seed.ts
   npx tsx scripts/seed-rbac.ts
   ```

### Security Configuration

#### 1. SSL/TLS Setup
- Obtain SSL certificate (Let's Encrypt recommended)
- Configure reverse proxy (Nginx/Apache)
- Enforce HTTPS redirects

#### 2. Database Security
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular backups

#### 3. Application Security
- Generate strong JWT secrets
- Use environment variables for secrets
- Enable CORS with specific origins
- Implement rate limiting

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=careconnect
      - POSTGRES_USER=careconnect
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Configuration Options

### Database Configuration

The application uses Drizzle ORM with PostgreSQL. Configuration options:

```typescript
// drizzle.config.ts
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
```

### Authentication Configuration

JWT settings in `server/middleware/auth.ts`:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = "24h"; // Adjust as needed
const SALT_ROUNDS = 12; // Password hashing rounds
```

### CORS Configuration

Configure allowed origins in `server/index.ts`:

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
```

## Monitoring and Maintenance

### Health Checks

The application includes health check endpoints:

- `GET /api/health/ready` - Application readiness
- `GET /api/admin/system/health` - Detailed system health (admin only)

### Logging

Configure application logging:

```typescript
// Add to server/index.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Database Maintenance

#### Regular Tasks
```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Analyze database performance
ANALYZE;

# Vacuum database
VACUUM ANALYZE;
```

#### Index Optimization
The application includes optimized indexes. Monitor query performance:

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Verify environment variables
echo $DATABASE_URL
```

#### 2. Permission Errors
```bash
# Reset database permissions
GRANT ALL PRIVILEGES ON DATABASE careconnect TO username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username;
```

#### 3. Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run check
```

#### 4. Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure password hashing is working

### Performance Optimization

#### 1. Database Performance
- Enable connection pooling
- Optimize query indexes
- Use prepared statements
- Monitor query performance

#### 2. Application Performance
- Enable compression middleware
- Implement caching strategies
- Optimize bundle size
- Use CDN for static assets

#### 3. Security Hardening
- Enable security headers
- Implement rate limiting
- Use secure session configuration
- Regular security updates

## Backup and Recovery

### Database Backups

#### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "/backups/careconnect_$DATE.sql"
```

#### Restore from Backup
```bash
# Drop existing database (CAUTION!)
dropdb careconnect

# Create new database
createdb careconnect

# Restore from backup
psql careconnect < backup_file.sql
```

### Application State

- User sessions are stateless (JWT)
- Application state is in database
- File uploads stored in configured storage

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple application instances
- Shared database backend
- Session store (Redis) for multi-instance

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling (pgBouncer)
- Database partitioning for large datasets
- Regular maintenance and optimization

---

For admin console usage, see [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
For user management procedures, see [USER_MANAGEMENT.md](./USER_MANAGEMENT.md).