# CareConnect Healthcare Management System - Admin Guide

## Overview

CareConnect is a comprehensive healthcare management system with advanced role-based access control (RBAC), user management, and administrative capabilities. This guide covers how to use the admin console and manage the system.

## Admin Console Access

### Prerequisites
- Admin-level permissions (`admin.view_console` permission)
- Valid authentication token

### Accessing the Admin Console
1. Log in to the application with admin credentials
2. Navigate to the Admin Console from the main navigation
3. If you don't see the Admin Console option, you may not have sufficient permissions

### Default Admin Credentials
```
Email: admin@clinic.com
Password: admin123
```

## Admin Console Features

### 1. Overview Dashboard

The Overview section provides real-time system statistics:

- **User Statistics**
  - Total Users: All registered users in the system
  - Active Users: Currently active user accounts
  - Total Roles: All available system roles
  - System Roles: Built-in roles that cannot be deleted

- **System Health**
  - Total Patients: Number of patient records
  - Today's Appointments: Scheduled appointments for today
  - System Uptime: How long the server has been running
  - Database Status: Real-time database health indicator

### 2. User Management

#### Viewing Users
- Filter users by role, status, or search by name/email
- View user details including creation date and activity status
- See assigned roles and permissions

#### Creating New Users
1. Click "Add User" button
2. Fill in user details:
   - Name
   - Email address
   - Password
   - Initial role assignment
3. Save to create the user account

#### Editing Users
1. Click the actions menu (⋮) next to a user
2. Select "Edit User"
3. Modify user information
4. Update role assignments
5. Save changes

#### User Status Management
- **Activate/Deactivate**: Toggle user account status
- Deactivated users cannot log in but data is preserved
- Use for temporary access suspension

### 3. Roles & Permissions Management

#### Available System Roles

1. **Master Admin**
   - Full system access
   - All 24 permissions
   - Cannot be deleted (system role)

2. **Clinic Admin**
   - Administrative access within clinic scope
   - 16 permissions including user management
   - Cannot be deleted (system role)

3. **Doctor**
   - Medical professional access
   - 14 permissions including clinical notes and prescriptions
   - Cannot be deleted (system role)

4. **Nurse**
   - Nursing staff access
   - 7 permissions focused on patient care
   - Cannot be deleted (system role)

5. **Receptionist**
   - Front desk operations
   - 7 permissions for scheduling and patient management
   - Cannot be deleted (system role)

6. **Analytics Only**
   - Read-only access for reports
   - 6 permissions limited to viewing and reporting
   - Cannot be deleted (system role)

7. **Staff**
   - Basic staff access
   - 3 permissions for minimal system access
   - Cannot be deleted (system role)

#### Permission Categories

1. **Patient Permissions**
   - `patients.view`: View patient information
   - `patients.create`: Create new patients
   - `patients.edit`: Edit patient information
   - `patients.deactivate`: Deactivate patients

2. **Appointment Permissions**
   - `appointments.view`: View appointments
   - `appointments.create`: Create appointments
   - `appointments.edit`: Edit appointments
   - `appointments.cancel`: Cancel appointments
   - `appointments.reschedule`: Reschedule appointments

3. **Schedule Permissions**
   - `schedule.view_own`: View own schedule
   - `schedule.view_all`: View all schedules
   - `schedule.manage`: Manage schedules

4. **Reports Permissions**
   - `reports.view`: View reports
   - `reports.export`: Export reports
   - `reports.advanced`: Access advanced analytics

5. **Clinical Permissions**
   - `clinical.notes.view`: View clinical notes
   - `clinical.notes.edit`: Edit clinical notes
   - `clinical.prescriptions.create`: Create prescriptions

6. **Admin Permissions**
   - `admin.view_console`: Access admin console
   - `admin.manage_users`: Manage users
   - `admin.manage_roles`: Manage roles and permissions
   - `admin.manage_clinics`: Manage clinics
   - `admin.view_audit_logs`: View audit logs
   - `admin.system_settings`: Modify system settings

#### Creating Custom Roles
1. Navigate to "Roles & Permissions" section
2. Click "Create Role"
3. Define role name and description
4. Select appropriate permissions
5. Save the role

#### Modifying Role Permissions
1. Select a role from the roles list
2. Add or remove permissions as needed
3. Save changes
4. Changes apply immediately to all users with that role

### 4. System Logs

The System Logs section provides:

#### Log Categories
- **System**: General system events and health checks
- **Auth**: Authentication and authorization events
- **Database**: Database operations and connection status
- **Warnings**: System warnings and potential issues

#### Log Information
- **Timestamp**: When the event occurred
- **Level**: INFO, WARN, ERROR
- **Source**: Which system component generated the log
- **Message**: Detailed event description

#### Monitoring Features
- Real-time log streaming
- Log level filtering
- Source-based filtering
- Searchable log history

## Security Best Practices

### User Management Security
1. **Regular Audits**: Review user accounts quarterly
2. **Principle of Least Privilege**: Assign minimum necessary permissions
3. **Deactivate Unused Accounts**: Remove access for departed staff
4. **Strong Passwords**: Enforce password complexity requirements
5. **Role Segregation**: Separate administrative and operational roles

### Access Control
1. **Review Permissions Regularly**: Audit role assignments monthly
2. **Monitor System Logs**: Check for unusual authentication patterns
3. **Limit Admin Access**: Minimize number of admin-level users
4. **Session Management**: Users are automatically logged out after token expiration

### Data Protection
1. **Patient Data**: All patient information is encrypted and access-controlled
2. **Audit Trail**: All admin actions are logged
3. **Backup Verification**: Ensure regular database backups
4. **Access Logging**: Monitor who accesses what data

## Troubleshooting

### Common Issues

#### Cannot Access Admin Console
- Verify user has `admin.view_console` permission
- Check if user account is active
- Confirm valid authentication token

#### User Cannot Perform Action
- Check user's role permissions
- Verify the specific permission exists for the action
- Ensure user account is active

#### System Health Issues
- Monitor database status in overview
- Check system logs for error messages
- Verify server uptime and performance

#### Permission Issues
- Review role assignments for affected users
- Check if role has required permissions
- Verify system roles haven't been modified

### Getting Help

1. **System Logs**: Check recent error messages
2. **User Permissions**: Verify role assignments
3. **Database Status**: Monitor health indicators
4. **Documentation**: Refer to setup and deployment guides

## Advanced Features

### Bulk User Operations
- Import users from CSV
- Bulk role assignments
- Mass user activation/deactivation

### Reporting and Analytics
- User activity reports
- Permission usage analytics
- System performance metrics

### Integration Points
- LDAP/Active Directory integration (future)
- Single Sign-On (SSO) support (future)
- API access for external systems

## Maintenance

### Regular Tasks
1. **Weekly**: Review system logs for issues
2. **Monthly**: Audit user accounts and permissions
3. **Quarterly**: Review and update role definitions
4. **Annually**: Complete security audit

### Performance Monitoring
- Monitor system uptime
- Track database performance
- Review user activity patterns
- Check storage usage

---

For technical setup and deployment information, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).
For user management procedures, see [USER_MANAGEMENT.md](./USER_MANAGEMENT.md).