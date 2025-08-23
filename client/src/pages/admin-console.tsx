import { useEffect, useState } from 'react';
import { Users, Shield, Settings, Activity, ChevronRight, UserPlus, ShieldCheck } from 'lucide-react';
import { canAccessAdminConsole, canManageUsers, canManageRoles } from '../lib/permissions';
import { getCurrentUser } from '../lib/auth';
import UsersManagement from '../components/admin/users-management';
import RolesManagement from '../components/admin/roles-management';

type AdminView = 'overview' | 'users' | 'roles' | 'settings' | 'audit';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  systemRoles: number;
}

export default function AdminConsole() {
  const user = getCurrentUser();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load admin statistics
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Load users and roles counts
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
          });
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (canAccessAdminConsole()) {
      loadStats();
    }
  }, []);

  // Check permissions
  if (!canAccessAdminConsole()) {
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
      id: 'settings' as AdminView,
      name: 'System Settings',
      icon: Settings,
      description: 'Configure system-wide settings',
      available: false // TODO: Implement
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'users':
        return <UsersManagement />;
      case 'roles':
        return <RolesManagement />;
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