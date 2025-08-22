# Overview

CareConnect is a full-stack healthcare management application that streamlines patient management and appointment scheduling for medical practices. Built with a modern React/TypeScript frontend and Express/Node.js backend, it provides essential features for managing patients, scheduling appointments, and tracking medical practice operations through an intuitive dashboard interface.

The system supports role-based authentication (admin, doctor, nurse, staff) and offers comprehensive CRUD operations for patient records and appointment management. It's designed as a simplified yet functional healthcare management system that can handle multiple clinics and provide real-time insights into practice operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using **React 18 with TypeScript** and **Vite** as the build tool, following a component-based architecture with clear separation of concerns:

- **UI Framework**: React with TypeScript for type safety and developer experience
- **Build System**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Component Structure**: Modular components organized by feature (layout, modals, pages, UI primitives)

The frontend follows a clean architecture with dedicated layers for UI components, business logic hooks, and API communication utilities.

## Backend Architecture
The backend uses **Express.js with TypeScript** in a layered architecture pattern:

- **Framework**: Express.js with TypeScript for robust server-side development
- **Architecture Pattern**: Layered architecture with clear separation between routes, middleware, and storage layers
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Storage Layer**: Abstracted storage interface allowing for flexible database implementations
- **Middleware**: Custom authentication middleware and request logging
- **Error Handling**: Centralized error handling with structured error responses

The server architecture promotes maintainability through dependency injection and interface-based design patterns.

## Data Storage Solutions
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations:

- **Database**: PostgreSQL for reliable relational data storage
- **ORM**: Drizzle ORM providing type-safe database queries and migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle migrations for version-controlled database schema changes
- **Data Models**: Strongly typed schemas for Users, Patients, Appointments, and Clinics with proper relationships

The database design includes proper foreign key relationships, enums for status fields, and optimized indexes for common query patterns.

## Authentication and Authorization
The system implements **JWT-based authentication** with role-based access control:

- **Authentication Method**: JWT tokens with configurable expiration
- **Password Security**: bcrypt hashing with configurable salt rounds (12)
- **Authorization**: Role-based access control (admin, doctor, nurse, staff)
- **Token Storage**: Client-side localStorage with automatic header injection
- **Session Management**: Automatic token validation and refresh patterns
- **Security Headers**: Custom middleware for request tracking and authentication

The auth system provides secure session management while maintaining a seamless user experience.

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection for Neon cloud database
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **express**: Web application framework for the Node.js backend server
- **@tanstack/react-query**: Powerful data synchronization for React applications

### UI and Component Libraries
- **@radix-ui/***: Comprehensive collection of accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating type-safe component variants
- **lucide-react**: Beautiful and consistent icon library

### Authentication and Security
- **jsonwebtoken**: JWT implementation for secure authentication tokens
- **bcryptjs**: Password hashing library for secure credential storage

### Development and Build Tools
- **vite**: Next generation frontend build tool for fast development
- **typescript**: Static type checking for enhanced developer experience
- **drizzle-kit**: CLI tool for database migrations and schema management

### Form and Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation library

The application is designed to run in both development and production environments with Docker support, making deployment and scaling straightforward.