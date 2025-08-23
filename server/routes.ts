import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { authenticate, type AuthRequest, hashPassword, verifyPassword, generateToken } from "./middleware/auth";
import { 
  loginSchema, 
  insertPatientSchema, 
  insertAppointmentSchema,
  insertUserSchema,
  insertClinicSchema,
  insertRoleSchema,
  insertPermissionSchema
} from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get("/api/health/ready", (req, res) => {
    res.json({ status: "ready" });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient routes
  app.get("/api/patients", authenticate, async (req: AuthRequest, res) => {
    try {
      const filters = {
        query: req.query.query as string,
        limit: parseInt(req.query.limit as string) || 10,
        offset: parseInt(req.query.offset as string) || 0,
        status: req.query.status as string,
        gender: req.query.gender as string,
        clinic: req.query.clinic as string,
        minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
        maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        hasUpcomingAppointment: req.query.hasUpcomingAppointment === 'true'
      };

      // Clean up undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const patients = await storage.getPatients(filters);
      res.json(patients);
    } catch (error) {
      console.error('Patient filtering error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patients/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/patients", authenticate, async (req: AuthRequest, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/patients/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const updates = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, updates);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", authenticate, async (req: AuthRequest, res) => {
    try {
      const filters = {
        clinicId: req.query.clinicId as string,
        doctorId: req.query.doctorId as string,
        status: req.query.status as string,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
      };

      const appointments = await storage.getAppointments(filters);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/appointments", authenticate, async (req: AuthRequest, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/appointments/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const updates = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, updates);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard route
  app.get("/api/dashboard/stats", authenticate, async (req: AuthRequest, res) => {
    try {
      const doctorId = req.user!.id;
      const clinicId = req.query.clinicId as string;
      
      // If no clinic ID provided, get the first available clinic
      let targetClinicId = clinicId;
      if (!targetClinicId) {
        const clinics = await storage.getClinics();
        if (clinics.length > 0) {
          targetClinicId = clinics[0].id;
        } else {
          return res.status(400).json({ message: "No clinics available" });
        }
      }

      const stats = await storage.getDashboardStats(doctorId, targetClinicId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clinic routes
  app.get("/api/clinics", authenticate, async (req: AuthRequest, res) => {
    try {
      const clinics = await storage.getClinics();
      res.json(clinics);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clinics", authenticate, async (req: AuthRequest, res) => {
    try {
      const clinicData = insertClinicSchema.parse(req.body);
      const clinic = await storage.createClinic(clinicData);
      res.status(201).json(clinic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin/RBAC Routes
  
  // Users management
  app.get("/api/admin/users", authenticate, async (req: AuthRequest, res) => {
    try {
      // Check if user has admin permissions
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_users')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const filters = {
        query: req.query.query as string,
        role: req.query.role as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const users = await storage.getUsers(filters);
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_users')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      res.status(201).json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error('Create user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_users')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updates = insertUserSchema.partial().parse(req.body);
      
      // Hash password if provided
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error('Update user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Roles management
  app.get("/api/admin/roles", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/roles/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/roles", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error('Create role error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/roles/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updates = insertRoleSchema.partial().parse(req.body);
      const role = await storage.updateRole(req.params.id, updates);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error('Update role error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/roles/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const success = await storage.deleteRole(req.params.id);
      if (!success) {
        return res.status(400).json({ message: "Cannot delete system role or role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Permissions management
  app.get("/api/admin/permissions", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Role-Permission assignments
  app.post("/api/admin/roles/:roleId/permissions", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { permissionId } = req.body;
      if (!permissionId) {
        return res.status(400).json({ message: "Permission ID is required" });
      }

      const assignment = await storage.assignPermissionToRole(req.params.roleId, permissionId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Assign permission error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/roles/:roleId/permissions/:permissionId", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_roles')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const success = await storage.removePermissionFromRole(req.params.roleId, req.params.permissionId);
      if (!success) {
        return res.status(404).json({ message: "Permission assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Remove permission error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User-Role assignments
  app.post("/api/admin/users/:userId/roles", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_users')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { roleId } = req.body;
      if (!roleId) {
        return res.status(400).json({ message: "Role ID is required" });
      }

      const assignment = await storage.assignRoleToUser(req.params.userId, roleId, req.user!.id);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:userId/roles/:roleId", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.manage_users')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const success = await storage.removeRoleFromUser(req.params.userId, req.params.roleId);
      if (!success) {
        return res.status(404).json({ message: "Role assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user permissions
  app.get("/api/admin/users/:userId/permissions", authenticate, async (req: AuthRequest, res) => {
    try {
      const userPermissions = await storage.getUserPermissions(req.user!.id);
      if (!userPermissions.includes('admin.view_console')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error) {
      console.error('Get user permissions error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
