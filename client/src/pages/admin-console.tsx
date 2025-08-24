import { useEffect, useState } from 'react';
import { Users, Shield, Settings, Activity, ChevronRight, UserPlus, ShieldCheck, Server, Database, Clock, AlertCircle } from 'lucide-react';
import { canAccessAdminConsole, canManageUsers, canManageRoles, loadUserPermissions, setUserPermissions } from '../lib/permissions';
import { getCurrentUser } from '../lib/auth';
import UsersManagement from '../components/admin/users-management';
import RolesManagement from '../components/admin/roles-management';

type AdminView = 'overview' | 'users' | 'roles' | 'settings' | 'logs';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  systemRoles: number;
  totalPatients: number;
  todayAppointments: number;
  systemUptime: string;
  databaseStatus: 'healthy' | 'warning' | 'error';
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
}

export default function AdminConsole() {
  const user = getCurrentUser();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      const user = getCurrentUser();
      if (!user) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const permissionsRes = await fetch(`/api/admin/users/${user.id}/permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (permissionsRes.ok) {
          const permissions = await permissionsRes.json();
          setUserPermissions(permissions);
        }
      } catch (error) {
        console.error('Failed to load permissions:', error);
      }
    };

    loadPermissions();
  }, []);

  useEffect(() => {
    // Load admin statistics
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Load system health data
        const healthRes = await fetch('/api/admin/system/health', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setStats(healthData);
        } else {
          // Fallback to individual calls if health endpoint fails
          const [usersRes, rolesRes] = await Promise.all([
            fetch('/api/admin/users', {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/admin/roles', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);

          if (usersRes.ok && rolesRes.ok) {
            const users = await usersRes.json();
            const roles = await rolesRes.json();
            
            setStats({
              totalUsers: users.length,
              activeUsers: users.filter((u: any) => u.isActive).length,
              totalRoles: roles.length,
              systemRoles: roles.filter((r: any) => r.isSystemRole).length,
              totalPatients: 0,
              todayAppointments: 0,
              systemUptime: 'Unknown',
              databaseStatus: 'healthy' as const
            });
          }
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    // Always load stats - permission check is done in render
    loadStats();
  }, []);

  // Check permissions with user role fallback
  if (!canAccessAdminConsole(user?.role as any)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the Admin Console.
          </p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'overview' as AdminView,
      name: 'Overview',
      icon: Activity,
      description: 'System overview and statistics',
      available: true
    },
    {
      id: 'users' as AdminView,
      name: 'Users',
      icon: Users,
      description: 'Manage system users and their access',
      available: canManageUsers()
    },
    {
      id: 'roles' as AdminView,
      name: 'Roles & Permissions',
      icon: Shield,
      description: 'Configure roles and permissions',
      available: canManageRoles()
    },
    {
      id: 'logs' as AdminView,
      name: 'System Logs',
      icon: Activity,
      description: 'View system logs and monitoring',
      available: canAccessAdminConsole()
    },
    {
      id: 'settings' as AdminView,
      name: 'System Settings',
      icon: Settings,
      description: 'Configure system-wide settings',
      available: false // TODO: Implement
    }
  ];

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/system/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'users':
        return <UsersManagement />;
      case 'roles':
        return <RolesManagement />;
      case 'logs':
        if (logs.length === 0 && !logsLoading) {
          loadLogs();
        }
        return renderLogs();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Console</h2>
        <p className="text-gray-600">Manage users, roles, and system configuration.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.totalUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.activeUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Roles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.totalRoles || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    System Roles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.systemRoles || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Patients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.totalPatients || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.todayAppointments || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    System Uptime
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats?.systemUptime || 'Unknown'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className={`h-6 w-6 ${
                  stats?.databaseStatus === 'healthy' ? 'text-green-600' :
                  stats?.databaseStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Database Status
                  </dt>
                  <dd className={`text-lg font-medium capitalize ${
                    stats?.databaseStatus === 'healthy' ? 'text-green-700' :
                    stats?.databaseStatus === 'warning' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {loading ? '...' : stats?.databaseStatus || 'Unknown'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canManageUsers() && (
            <button
              onClick={() => setActiveView('users')}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserPlus className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Manage Users</h4>
                    <p className="text-sm text-gray-500">Add, edit, or deactivate users</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          )}

          {canManageRoles() && (
            <button
              onClick={() => setActiveView('roles')}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Manage Roles</h4>
                    <p className="text-sm text-gray-500">Configure roles and permissions</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Logs</h2>
        <p className="text-gray-600">Monitor system activity and application logs.</p>
      </div>

      {/* Log Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">System</p>
              <p className="text-xs text-blue-700">{logs.filter(log => log.source === 'system').length} entries</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Auth</p>
              <p className="text-xs text-green-700">{logs.filter(log => log.source === 'auth').length} entries</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Database</p>
              <p className="text-xs text-purple-700">{logs.filter(log => log.source === 'database').length} entries</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Warnings</p>
              <p className="text-xs text-yellow-700">{logs.filter(log => log.level === 'warn').length} entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">Latest system logs and events</p>
        </div>
        
        {logsLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading logs...</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                        log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                        log.level === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.source}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!logsLoading && logs.length === 0 && (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs available</h3>
            <p className="mt-1 text-sm text-gray-500">
              System logs will appear here when available.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-semibold text-gray-900">Admin Console</h1>
            <p className="text-sm text-gray-500 mt-1">System Management</p>
          </div>
          
          <nav className="mt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => item.available && setActiveView(item.id)}
                  disabled={!item.available}
                  className={`
                    w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors
                    ${activeView === item.id 
                      ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' 
                      : item.available
                        ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {renderActiveView()}
          </div>
        </div>
      </div>
    </div>
  );
}